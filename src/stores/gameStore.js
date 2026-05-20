import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createFoundCityState, createInitialGameState } from '../data/gameInit';
import { resolveNextConstructionSpec } from '../data/buildingCatalog';
import {
  BUILDING_RESOURCE_MAP,
  createQueueTiming,
  formatSeconds,
  genId,
  nowReportDate,
  parseTimeToSeconds,
  ratePerSecond,
  recalculateResourceRates,
  remainingFromEndsAt,
} from '../lib/gameUtils';
import { landUnits } from '../data/placeholder';
import { CONSTRUCTION_QUEUE_LIMIT } from '../lib/gameConstants';
import { EXPEDITION_DURATIONS } from '../lib/expeditionConfig';
import {
  calcExpeditionTravelSeconds,
  formatDistanceKm,
  getExpeditionDistanceKm,
  isAirOnlyExpedition,
  resolveCityCoords,
} from '../lib/expeditionTravel';
import {
  canRecallMeydanTroops,
  getMeydanBattleAt,
  MEYDAN_PREP_SECONDS,
} from '../lib/meydanBattleConfig';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import {
  syncRegistryFromMap,
  touchPlayerActivity,
} from '../lib/playerActivityRegistry';
import {
  applyVipAscensionToMeta,
  loadPlayerMeta,
  savePlayerMeta,
} from '../lib/playerMetaStorage';
import { runServerCleansing, formatInactivityDays, WAKE_CLEANSING_THROTTLE_MS } from '../lib/serverCleansing';
import { purgeExpeditionsOnVipAscension } from '../lib/expeditionLifecycle';
import { applyProductionFreeze } from '../lib/resourceProduction';
import {
  canOfferVipAscension,
  computeDevelopmentScore,
  formatVipBonusPercent,
  getVipProductionMultiplier,
} from '../lib/vipPrestige';
import { buildPostAscensionGamePatch } from '../lib/vipAscension';
import {
  applyTradeDelivery,
  canAffordTrade,
  deductTradeResources,
  formatTradeCargoSummary,
  sumTradeAmounts,
} from '../lib/tradeUtils';
import {
  canAffordPopulation,
  deductPopulation,
  getAgentPopulationCost,
  getUnitPopulationCost,
  restorePopulation,
} from '../lib/populationUtils';
import {
  FOUND_CITY_COLONIST_ID,
  FOUND_CITY_COST,
  FOUND_CITY_MIN_COLONISTS,
  resolveFoundCityName,
} from '../lib/foundCityConfig';
import { arePrerequisitesMet, PANEL_LOCKED_BUILDING_IDS } from '../lib/buildingUtils';
import { syncMapCitiesForPlayer } from '../map/mapOwnership';
import { applyExpeditionLoot, refundCostWithDepotCap } from '../lib/lootUtils';
import { buildLossRows } from '../lib/reportLosses';
import { findSpyReportForCity, getEnemyTroopsFromReport } from '../lib/spyIntel';
import {
  buildCombatReport,
  calcRaidLoot,
  LOOT_RATE,
  resolveDefenderArmy,
  resolveDefenderDepot,
  runCombat,
} from '../utils/combatEngine';
import {
  calcCyberVirusTravelSeconds,
  calcSpyProbeTravelSeconds,
  generateBotResearches,
  generateDefenderBuildings,
  generateBotKbrnResearches,
  resolveCyberVirusMission,
  resolveSpyMission,
} from '../utils/spyEngine';
import { getTroopsAwayFromCity } from '../lib/troopStock';
import { canAffordCost, deductCost } from '../utils/resourceCosts';
import { useNotificationStore } from './notificationStore';
import { clampTaxRate, enrichCityModel } from '../lib/cityModel';
import {
  buildCyberOpsLogEntry,
  canLaunchCyberAbility,
  getUnlockedCyberCapabilities,
} from '../lib/cyberOps';
import {
  canLaunchStealthCbrnOp,
  getWeaponDevelopmentLevel,
  isKbrnBranchUnlocked,
  scaleKbrnResearchCost,
} from '../lib/kbrnResearch';
import {
  buildKbrnDefenderAlertReport,
  calcKbrnChemTravelSeconds,
  getCbrnChemOpCost,
  resolveKbrnChemMission,
  tickCbrnWorldEvents,
  triggerRandomCbrnEvent as rollGlobalCbrnOutbreak,
} from '../utils/cbrnEngine';
import {
  computeCityHappiness,
  getActiveCyberBarracksSlow,
  getActiveKbrnBarracksBlock,
  getHappinessProductionSpeedMultiplier,
  getKbrnPopulationDrain,
  pruneCyberEffects,
  pruneKbrnEffects,
} from '../lib/happinessSystem';
import {
  hydrateGameStore,
  isSyncEnabled,
  scheduleSaveGameState,
  syncExpeditionsFromServer,
} from '../lib/supabaseSync';

/** Stable fallbacks — React 19 getSnapshot must return cached references when store is unchanged. */
export const STORE_EMPTY_ARRAY = [];

function cloudSync(get, options = {}) {
  const state = get();
  if (!state._supabaseHydrated) return;
  scheduleSaveGameState(state, options);
}

function getActiveCity(state) {
  return state.cities[state.activeCityId];
}

function patchCity(set, get, cityId, patch) {
  const { cities } = get();
  set({
    cities: {
      ...cities,
      [cityId]: { ...cities[cityId], ...patch },
    },
  });
}

function refreshCityMorale(state, cityId) {
  const city = state.cities[cityId];
  if (!city) return city;

  const cyberEffects = pruneCyberEffects(city.cyberEffects);
  const kbrnEffects = pruneKbrnEffects(city.kbrnEffects);
  const happiness = computeCityHappiness(
    { ...city, cyberEffects, kbrnEffects },
    {
      cityId,
      incomingAttacks: state.incomingAttacks,
      expeditions: state.expeditions,
    },
  );
  const popDrain = getKbrnPopulationDrain(kbrnEffects);
  const basePopulation = city.basePopulation ?? city.population ?? 0;
  const population = Math.max(400, basePopulation - popDrain);
  const vipMult = getVipMultiplierFromState(state);
  const resources = applyProductionFreeze(
    city.resources,
    city.buildings,
    {
      ...city,
      cityId,
      cyberEffects,
      kbrnEffects,
      happiness,
      population,
      _incomingAttacks: state.incomingAttacks,
      _expeditions: state.expeditions,
    },
    vipMult,
  );

  return enrichCityModel({
    ...city,
    cyberEffects,
    kbrnEffects,
    happiness,
    population,
    basePopulation,
    resources,
  });
}

function refreshAllCitiesMorale(state) {
  const cities = {};
  for (const [cityId] of Object.entries(state.cities)) {
    cities[cityId] = refreshCityMorale(state, cityId);
  }
  return cities;
}

function slugCityId(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || genId('city');
}

function formatTroopsSummary(troopQty, idleTroops) {
  return idleTroops
    .filter((t) => troopQty[t.id] > 0)
    .map((t) => `${troopQty[t.id]} ${t.name}`)
    .join(', ') || '—';
}

function generateBattleReport(expedition, won = true) {
  const target = expedition.target;
  const payload = expedition.troopPayload && !expedition.troopPayload.spies
    ? expedition.troopPayload
    : null;

  const attackerLossRows = payload
    ? landUnits
        .filter((u) => (payload[u.id] || 0) > 0)
        .map((u) => {
          const sent = payload[u.id] || 0;
          const lost = won
            ? Math.floor(sent * (0.02 + Math.random() * 0.12))
            : Math.floor(sent * (0.4 + Math.random() * 0.45));
          return { unitId: u.id, name: u.name, icon: u.image, sent, lost: Math.min(sent, lost) };
        })
    : [];

  const attackerLosses = attackerLossRows
    .filter((r) => r.lost > 0)
    .map((r) => `${r.lost} ${r.name}`)
    .join(', ') || 'Kayıp yok';

  const defenderLossRows = won
    ? [{ name: 'Garnizon', icon: '🏰', sent: 0, lost: 0, note: 'Garnizon imha' }]
    : [{ name: 'Piyade', icon: '🪖', sent: 0, lost: 22 + Math.floor(Math.random() * 30) }];

  const loot = won
    ? [
        { icon: '🌾', label: 'Yemek', amount: 1200 + Math.floor(Math.random() * 800) },
        { icon: '⚙️', label: 'Metal', amount: 900 + Math.floor(Math.random() * 500) },
        { icon: '💰', label: 'Para', amount: 400 + Math.floor(Math.random() * 300) },
      ]
    : [];

  return {
    id: genId('r'),
    filterType: 'battle',
    type: 'Savaş',
    title: `${target} — Saldırı Raporu`,
    date: nowReportDate(),
    preview: won ? 'Zafer! Ganimet toplandı.' : 'Yenilgi. Birlikler geri çekildi.',
    winner: won ? 'player' : 'enemy',
    attacker: 'Komutan_Alpha',
    defender: target,
    attackerLosses,
    defenderLosses: won ? 'Garnizon imha' : defenderLossRows.map((r) => `${r.lost} ${r.name}`).join(', '),
    attackerLossRows,
    defenderLossRows,
    troopPayload: payload,
    originCityId: expedition.originCityId,
    loot,
    isNew: true,
  };
}

function buildSpyIntelFields(success) {
  const factoryLevel = 5 + Math.floor(Math.random() * 4);
  const infantry = 800 + Math.floor(Math.random() * 1600);
  const tank = 20 + Math.floor(Math.random() * 80);
  const armor = 50 + Math.floor(Math.random() * 150);
  const foodStock = 4000 + Math.floor(Math.random() * 8000);
  const metalStock = 2000 + Math.floor(Math.random() * 5000);

  if (!success) {
    return [
      { key: 'factory', label: 'Fabrika Seviyesi', hidden: true },
      { key: 'food', label: 'Yemek Deposu', hidden: true },
      { key: 'metal', label: 'Metal Deposu', hidden: true },
      { key: 'infantry', label: 'Piyade', hidden: true },
      { key: 'tank', label: 'Tank', hidden: true },
      { key: 'armor', label: 'Zırhlı', hidden: true },
    ];
  }

  const maybeHide = () => Math.random() > 0.55;
  return [
    { key: 'factory', label: 'Fabrika Seviyesi', value: `Sv.${factoryLevel}`, hidden: maybeHide() },
    { key: 'food', label: 'Yemek Deposu', value: foodStock.toLocaleString('tr-TR'), hidden: maybeHide() },
    { key: 'metal', label: 'Metal Deposu', value: metalStock.toLocaleString('tr-TR'), hidden: maybeHide() },
    { key: 'infantry', label: 'Piyade', value: infantry.toLocaleString('tr-TR'), hidden: maybeHide() },
    { key: 'tank', label: 'Tank', value: String(tank), hidden: maybeHide() },
    { key: 'armor', label: 'Zırhlı Araç', value: String(armor), hidden: maybeHide() },
  ];
}

function generateSpyReport(expedition, success = true) {
  const intelFields = buildSpyIntelFields(success);
  const enemyTroops = success
    ? {
        infantry: 800 + Math.floor(Math.random() * 1600),
        tank: 20 + Math.floor(Math.random() * 80),
        armor: 50 + Math.floor(Math.random() * 150),
      }
    : {};
  const visible = intelFields.filter((f) => !f.hidden && f.value);
  return {
    id: genId('r'),
    filterType: 'spy',
    type: 'Casusluk',
    title: `${expedition.target} — Keşif Raporu`,
    date: nowReportDate(),
    preview: success ? 'Hedef şehir bilgileri alındı.' : 'Casuslar yakalandı.',
    winner: null,
    targetCity: expedition.target,
    intelSuccess: success,
    intelFields,
    findings: success
      ? (visible.length
        ? visible.map((f) => `${f.label}: ${f.value}`).join(' · ')
        : 'Şifreli alanlar — kısmi veri')
      : 'Tüm casuslar kayıp',
    enemyTroops: success ? enemyTroops : {},
    isNew: true,
  };
}

function generateTradeReport(expedition, delivered, overflow = []) {
  const cargo = formatTradeCargoSummary(expedition.tradePayload?.resources ?? {});
  return {
    id: genId('r'),
    filterType: 'trade',
    type: 'Ticaret',
    title: `${expedition.originCityName} → ${expedition.target} — Lojistik Raporu`,
    date: nowReportDate(),
    preview: delivered
      ? (overflow.length ? 'Teslimat yapıldı — depo taşması var.' : 'Kargo hedef şehre ulaştı.')
      : 'Konvoy geri döndü.',
    cargo,
    overflow,
    originCityId: expedition.originCityId,
    targetCity: expedition.target,
    isNew: true,
  };
}

function generateAgentReport(op, success, agentsLost) {
  const intelFields = buildSpyIntelFields(success);
  return {
    id: genId('r'),
    filterType: 'spy',
    type: 'Ajan Operasyonu',
    title: `${op.target} — ${op.opType}`,
    date: nowReportDate(),
    preview: success ? 'Ajan operasyonu başarılı.' : `${agentsLost} ajan imha edildi.`,
    targetCity: op.target,
    intelSuccess: success,
    intelFields,
    agentsLost,
    findings: success ? 'Hedef verileri sızdırıldı.' : 'Operasyon başarısız — ajanlar kayıp',
    isNew: true,
  };
}

let globalTickerId = null;

const CLEANSING_INTERVAL_TICKS = 120;

function getVipMultiplierFromState(state) {
  return getVipProductionMultiplier(state.playerMeta?.vipTier ?? 0);
}

function restoreTroopsToCity(city, troopPayload) {
  if (!troopPayload) return city;
  if (troopPayload.kbrn?.agents != null) {
    return {
      ...city,
      idleAgents: (city.idleAgents ?? 0) + troopPayload.kbrn.agents,
    };
  }
  if (troopPayload.cyberVirus?.agents != null) {
    return {
      ...city,
      idleAgents: (city.idleAgents ?? 0) + troopPayload.cyberVirus.agents,
    };
  }
  if (troopPayload.spies != null) {
    return {
      ...city,
      idleSpies: city.idleSpies + troopPayload.spies,
    };
  }
  const idleTroops = city.idleTroops.map((t) => ({
    ...t,
    available: t.available + (troopPayload[t.id] || 0),
  }));
  return { ...city, idleTroops };
}

function tickAllCities(state, now) {
  const cities = { ...state.cities };
  const completed = { construction: [], production: [] };

  for (const [cityId, city] of Object.entries(cities)) {
    let constructionQueue = city.constructionQueue.map((q) => ({ ...q }));
    let productionQueue = city.productionQueue.map((q) => ({ ...q }));

    const activeBuild = constructionQueue.find((q) => !q.queued && q.endsAt != null);
    if (activeBuild && activeBuild.endsAt <= now) {
      completed.construction.push({ cityId, itemId: activeBuild.id });
    }

    const activeProd = productionQueue.find((q) => !q.queued && q.endsAt != null);
    if (activeProd && activeProd.endsAt <= now) {
      completed.production.push({ cityId, itemId: activeProd.id });
    }

    cities[cityId] = { ...city, constructionQueue, productionQueue };
  }

  return { cities, completed };
}

export const useGameStore = create((set, get) => ({
  ...createInitialGameState(loadPlayerMeta()),

  contentInfoPayload: null,

  openContentInfo: (payload) => set({ contentInfoPayload: payload ?? null }),

  closeContentInfo: () => set({ contentInfoPayload: null }),

  getActiveCity: () => getActiveCity(get()),

  getDevelopmentScore: () => computeDevelopmentScore(get()),

  canVipAscend: () => canOfferVipAscension(get()),

  touchPlayerActivity: () => {
    const now = Date.now();
    touchPlayerActivity(getCurrentPlayerName(), now);
    const playerMeta = { ...get().playerMeta, lastActiveAt: now };
    savePlayerMeta(playerMeta);
    set({ playerMeta });
  },

  initWorldSystems: () => {
    const state = get();
    const playerName = getCurrentPlayerName();
    const mapCities = syncMapCitiesForPlayer(state.mapCities, state.playerCities, playerName);
    syncRegistryFromMap(mapCities);
    set({ mapCities });
    get()._runServerCleansing(false);
    get().touchPlayerActivity();
  },

  hydrateFromSupabase: async (userId, playerName) => {
    const ok = await hydrateGameStore(userId, {
      playerName,
      getState: get,
      setState: (patch) => set(patch),
      completeExpedition: (id) => get()._completeExpedition(id),
    });
    if (ok) get().initWorldSystems();
    return ok;
  },

  _runServerCleansing: (notify = true, source = 'tick') => {
    if (source === 'wake') {
      const last = get()._lastWakeCleansingAt ?? 0;
      if (Date.now() - last < WAKE_CLEANSING_THROTTLE_MS) return;
      set({ _lastWakeCleansingAt: Date.now() });
    }

    const state = get();
    const result = runServerCleansing(state.mapCities, state.expeditions);
    const expeditionsChanged = result.expeditions.length !== state.expeditions.length
      || result.expeditions.some((exp, i) => exp !== state.expeditions[i]);
    if (result.liberatedCount === 0 && !expeditionsChanged) return;

    set({
      mapCities: result.mapCities,
      expeditions: result.expeditions,
      mapRouteSyncRev: (state.mapRouteSyncRev ?? 0) + 1,
      navBadges: {
        ...state.navBadges,
        expeditions: result.expeditions.length > 0,
      },
    });

    if (notify && result.liberatedCount > 0) {
      useNotificationStore.getState().addToast(
        `Sunucu temizliği: ${result.liberatedCount} hayalet şehir boş araziye dönüştürüldü (${formatInactivityDays()}+ gün inaktif).`,
        'info',
      );
    }
  },

  performVipAscension: () => {
    const state = get();
    if (!canOfferVipAscension(state)) return false;

    const playerName = getCurrentPlayerName();
    const nextMeta = applyVipAscensionToMeta(state.playerMeta ?? loadPlayerMeta());
    savePlayerMeta(nextMeta);

    const now = Date.now();
    const expeditionPatch = purgeExpeditionsOnVipAscension(state, playerName, now);
    const patch = buildPostAscensionGamePatch(state, nextMeta, playerName);

    set({
      ...patch,
      expeditions: expeditionPatch.expeditions,
      intelOperations: expeditionPatch.intelOperations,
      incomingAttacks: expeditionPatch.incomingAttacks,
      meydanBattle: expeditionPatch.meydanBattle,
      navBadges: {
        ...patch.navBadges,
        expeditions: expeditionPatch.expeditions.length > 0,
      },
      playerMeta: nextMeta,
      reports: [],
      researches: state.researches.map((r) => ({ ...r, level: 0, active: false, queued: false })),
      now,
    });

    touchPlayerActivity(playerName);

    useNotificationStore.getState().addToast(
      `VIP Atma tamamlandı — ${formatVipBonusPercent(nextMeta.vipTier)} kalıcı maden bonusu aktif.`,
      'success',
    );
    return true;
  },

  setActiveCity: (cityId) => {
    if (!get().cities[cityId]) return;
    set({ activeCityId: cityId, now: Date.now() });
    cloudSync(get, { cityId, activeCityId: true });
  },

  setCityTaxRate: (taxRate) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city) return false;

    const nextRate = clampTaxRate(taxRate);
    const nextCity = refreshCityMorale(
      { ...state, cities: { ...state.cities, [cityId]: { ...city, taxRate: nextRate } } },
      cityId,
    );

    patchCity(set, get, cityId, { taxRate: nextRate, happiness: nextCity.happiness, resources: nextCity.resources });
    useNotificationStore.getState().addToast(
      `Vergi oranı %${nextRate} — moral ${nextCity.happiness}%`,
      nextRate > 20 ? 'warn' : 'info',
    );
    cloudSync(get, { cityId });
    return true;
  },

  getCyberCapabilities: () => {
    const city = get().cities[get().activeCityId];
    return getUnlockedCyberCapabilities(city);
  },

  launchCyberAttack: ({ abilityId, targetCityName, agentCount = 1 }) => {
    const state = get();
    const mapCity = state.mapCities.find((c) => c.name === targetCityName);
    if (!mapCity) return false;
    return get().startCyberVirusExpedition({
      targetCity: mapCity,
      abilityId,
      agentCount,
    });
  },

  startCyberVirusExpedition: ({ targetCity, abilityId, agentCount = 1 }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city || !targetCity?.name) return false;

    const check = canLaunchCyberAbility(city, abilityId);
    if (!check.ok) {
      useNotificationStore.getState().addToast(check.reason, 'warn');
      return false;
    }

    const ability = check.ability;
    const agents = Math.max(1, Math.floor(Number(agentCount) || 1));
    if ((city.idleAgents ?? 0) < agents) {
      useNotificationStore.getState().addToast('Yetersiz siber ajan', 'warn');
      return false;
    }

    if (!canAffordCost(ability.cost, 1, city.resources)) {
      useNotificationStore.getState().addToast('Siber operasyon için yetersiz kaynak', 'warn');
      return false;
    }

    const popCost = getAgentPopulationCost(agents);
    if (!canAffordPopulation(city, popCost)) {
      useNotificationStore.getState().addToast('Nüfus yetersiz — ajan konvoyu', 'warn');
      return false;
    }

    const isOwn = state.playerCities.some((pc) => pc.name === targetCity.name);
    if (isOwn) {
      useNotificationStore.getState().addToast('Kendi üssünüze siber saldırı gönderilemez', 'warn');
      return false;
    }

    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const targetCoords = { lat: targetCity.lat, lng: targetCity.lng };
    const duration = calcCyberVirusTravelSeconds({
      origin,
      target: targetCoords,
      agentCount: agents,
      mapCities: state.mapCities,
    });
    const distKm = getExpeditionDistanceKm(origin, targetCoords);
    const timing = createQueueTiming(duration);

    const resources = deductCost(ability.cost, 1, city.resources);
    const withPop = deductPopulation(
      { ...city, resources, idleAgents: (city.idleAgents ?? 0) - agents },
      popCost,
    );

    const expedition = {
      id: genId('exp'),
      originCityId: cityId,
      originCityName,
      target: targetCity.name,
      targetLat: targetCity.lat,
      targetLng: targetCity.lng,
      mode: 'cyber',
      type: 'Siber Virüs Konvoyu',
      direction: 'outgoing',
      troops: `${agents} Siber Ajan`,
      troopPayload: { cyberVirus: { abilityId, agents } },
      player: getCurrentPlayerName(),
      units: agents,
      distance: formatDistanceKm(distKm),
      airRush: false,
      durationSeconds: duration,
      ...timing,
    };

    patchCity(set, get, cityId, {
      resources: withPop.resources,
      idleAgents: withPop.idleAgents,
      idlePopulation: withPop.idlePopulation,
    });

    set({
      expeditions: [...state.expeditions, expedition],
      navBadges: { ...state.navBadges, expeditions: true },
    });

    useNotificationStore.getState().addToast(
      `${agents} siber ajan — ${ability.name} → ${targetCity.name}`,
      'intel',
    );
    cloudSync(get, {
      cityId,
      immediate: true,
      expedition: expedition,
    });
    return true;
  },

  startKbrnChemExpedition: ({ targetCity, agentCount = 2 }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city || !targetCity?.name) return false;

    if (!isKbrnBranchUnlocked(city)) {
      useNotificationStore.getState().addToast(
        'KBRN dalı için Ar-Ge Merkezi Sv.8+ gerekli',
        'warn',
      );
      return false;
    }

    if (!canLaunchStealthCbrnOp(state.researches)) {
      useNotificationStore.getState().addToast(
        'KBRN Silahı Geliştirme araştırmasını tamamlayın',
        'warn',
      );
      return false;
    }

    const chemLevel = getWeaponDevelopmentLevel(state.researches);
    const costStr = getCbrnChemOpCost(chemLevel);
    const agents = Math.max(1, Math.floor(Number(agentCount) || 1));

    if ((city.idleAgents ?? 0) < agents) {
      useNotificationStore.getState().addToast('Yetersiz KBRN operatörü (ajan)', 'warn');
      return false;
    }

    if (!canAffordCost(costStr, 1, city.resources)) {
      useNotificationStore.getState().addToast('KBRN operasyonu için yetersiz kaynak', 'warn');
      return false;
    }

    const popCost = getAgentPopulationCost(agents);
    if (!canAffordPopulation(city, popCost)) {
      useNotificationStore.getState().addToast('Nüfus yetersiz — KBRN timi', 'warn');
      return false;
    }

    if (state.playerCities.some((pc) => pc.name === targetCity.name)) {
      useNotificationStore.getState().addToast('Kendi üssünüze KBRN saldırısı yapılamaz', 'warn');
      return false;
    }

    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const targetCoords = { lat: targetCity.lat, lng: targetCity.lng };
    const duration = calcKbrnChemTravelSeconds({
      origin,
      target: targetCoords,
      agentCount: agents,
      mapCities: state.mapCities,
    });
    const distKm = getExpeditionDistanceKm(origin, targetCoords);
    const timing = createQueueTiming(duration);

    const resources = deductCost(costStr, 1, city.resources);
    const withPop = deductPopulation(
      { ...city, resources, idleAgents: (city.idleAgents ?? 0) - agents },
      popCost,
    );

    const expedition = {
      id: genId('exp'),
      originCityId: cityId,
      originCityName,
      target: targetCity.name,
      targetLat: targetCity.lat,
      targetLng: targetCity.lng,
      mode: 'kbrn',
      type: 'KBRN Kimyasal Baskı',
      direction: 'outgoing',
      troops: `${agents} KBRN Operatörü`,
      troopPayload: { kbrn: { opId: 'chem_pressure', agents } },
      player: getCurrentPlayerName(),
      units: agents,
      distance: formatDistanceKm(distKm),
      airRush: false,
      durationSeconds: duration,
      ...timing,
    };

    patchCity(set, get, cityId, {
      resources: withPop.resources,
      idleAgents: withPop.idleAgents,
      idlePopulation: withPop.idlePopulation,
    });

    set({
      expeditions: [...state.expeditions, expedition],
      navBadges: { ...state.navBadges, expeditions: true },
    });

    useNotificationStore.getState().addToast(
      `KBRN kimyasal baskı — ${targetCity.name} (${agents} operatör)`,
      'warn',
    );
    cloudSync(get, { cityId, immediate: true, expedition });
    return true;
  },

  /** Test / GM — anında bölgesel salgın tetikle */
  triggerGlobalCbrnEvent: () => {
    const state = get();
    if (state.globalCbrnOutbreak?.active) return false;
    const rolled = rollGlobalCbrnOutbreak(state);
    if (!rolled) return false;

    let cities = { ...state.cities, ...rolled.cityPatches };
    cities = Object.fromEntries(
      Object.entries(cities).map(([id, c]) => [
        id,
        refreshCityMorale({ ...state, cities }, id),
      ]),
    );

    set({
      globalCbrnOutbreak: rolled.globalCbrnOutbreak,
      mapCities: rolled.mapCities,
      cities,
      newsLog: [rolled.newsItem, ...(state.newsLog ?? [])].slice(0, 48),
      lastCbrnEventAt: rolled.lastCbrnEventAt,
    });

    useNotificationStore.getState().addToast(rolled.newsItem.text, 'danger');
    cloudSync(get, { saveAllCities: true, savePlayerMeta: true, researches: true });
    return true;
  },

  clearNavBadge: (key) => {
    set((s) => ({
      navBadges: { ...s.navBadges, [key]: false },
    }));
  },

  tick: () => {
    const now = Date.now();
    const state = get();
    const activeCityId = state.activeCityId;
    const activeCity = state.cities[activeCityId];
    if (!activeCity) return;

    const flashes = {};
    const resources = activeCity.resources.map((r) => {
      const frozen = r.max != null && r.current > r.max;
      if (frozen) return r;
      const increment = ratePerSecond(r.rate);
      let next = r.current + increment;
      if (r.max != null) next = Math.min(r.max, next);
      const rounded = Math.floor(next);
      if (rounded > Math.floor(r.current)) flashes[r.id] = true;
      return { ...r, current: rounded };
    });

    const refreshed = refreshCityMorale(
      { ...state, cities: { ...state.cities, [activeCityId]: { ...activeCity, resources } } },
      activeCityId,
    );
    patchCity(set, get, activeCityId, {
      resources: refreshed.resources,
      happiness: refreshed.happiness,
      cyberEffects: refreshed.cyberEffects,
      kbrnEffects: refreshed.kbrnEffects,
      population: refreshed.population,
      quarantine: refreshed.quarantine,
    });

    const cleanseTick = (state._cleansingTick ?? 0) + 1;
    if (cleanseTick >= CLEANSING_INTERVAL_TICKS) {
      get()._runServerCleansing(true);
      set({ _cleansingTick: 0 });
    } else {
      set({ _cleansingTick: cleanseTick });
    }

    const stateBeforeQueues = get();
    const { cities: queueCities, completed } = tickAllCities(stateBeforeQueues, now);
    const stateForMorale = { ...get(), cities: queueCities };
    let cities = Object.fromEntries(
      Object.entries(queueCities).map(([id]) => [id, refreshCityMorale(stateForMorale, id)]),
    );

    const cbrnState = { ...stateBeforeQueues, cities, now };
    const cbrnPatch = tickCbrnWorldEvents(cbrnState, now);
    if (cbrnPatch?.cities) {
      const merged = { ...cities, ...cbrnPatch.cities };
      cities = Object.fromEntries(
        Object.entries(merged).map(([id, c]) => [
          id,
          refreshCityMorale({ ...get(), cities: merged, now }, id),
        ]),
      );
    }

    const completedExpeditionIds = [];
    for (const e of state.expeditions) {
      if (e.endsAt != null && e.endsAt <= now) completedExpeditionIds.push(e.id);
    }
    const expeditions = state.expeditions;

    const researchList = state.researches ?? [];
    let researches = researchList.map((r) => ({ ...r }));
    const completedResearchIds = [];
    researches = researches.map((r) => {
      if (!r.active || r.endsAt == null || r.endsAt > now) return r;
      completedResearchIds.push(r.id);
      return {
        ...r,
        active: false,
        queued: false,
        level: (r.level ?? 0) + 1,
        startedAt: null,
        endsAt: null,
        durationSeconds: null,
      };
    });

    let intelOperations = (state.intelOperations ?? []).map((o) => ({ ...o }));
    const completedIntelIds = [];
    intelOperations = intelOperations.map((o) => {
      if (o.endsAt == null || o.endsAt > now) return o;
      completedIntelIds.push(o.id);
      return o;
    });

    set({
      now,
      lastTickAt: now,
      cities,
      flashes,
      expeditions,
      researches,
      intelOperations,
      ...(cbrnPatch?.globalCbrnOutbreak != null
        ? { globalCbrnOutbreak: cbrnPatch.globalCbrnOutbreak }
        : {}),
      ...(cbrnPatch?.mapCities ? { mapCities: cbrnPatch.mapCities } : {}),
      ...(cbrnPatch?.newsLog ? { newsLog: cbrnPatch.newsLog } : {}),
      ...(cbrnPatch?.lastCbrnEventAt ? { lastCbrnEventAt: cbrnPatch.lastCbrnEventAt } : {}),
      ...(cbrnPatch?._cbrnTickCount != null ? { _cbrnTickCount: cbrnPatch._cbrnTickCount } : {}),
    });

    if (cbrnPatch?.newsLog?.length) {
      const latest = cbrnPatch.newsLog[0];
      if (latest?.type === 'global-alarm') {
        useNotificationStore.getState().addToast(latest.text, 'danger');
      }
    }
    if (cbrnPatch?.saveCbrn) {
      cloudSync(get, { saveAllCities: true, savePlayerMeta: true, researches: true });
    }

    completedResearchIds.forEach((id) => {
      const r = researches.find((x) => x.id === id);
      if (r) {
        useNotificationStore.getState().addToast(
          `Araştırma tamamlandı: ${r.name} Sv.${r.level}`,
          'success',
        );
      }
    });

    if (Object.keys(flashes).length > 0) {
      setTimeout(() => {
        if (Object.keys(get().flashes).length > 0) set({ flashes: {} });
      }, 650);
    }

    completed.construction.forEach(({ cityId, itemId }) => get()._completeConstruction(cityId, itemId));
    completed.production.forEach(({ cityId, itemId }) => get()._completeProduction(cityId, itemId));
    completedExpeditionIds.forEach((id) => get()._completeExpedition(id));
    completedIntelIds.forEach((id) => get()._completeIntelOperation(id));

    const meydan = get().meydanBattle;
    if (meydan?.status === 'preparing' && meydan.battleAt <= now) {
      get()._resolveMeydanBattle();
    }

    const incomingAttacks = state.incomingAttacks.map((a) => ({ ...a }));
    const completedIncomingIds = [];
    const nextIncoming = incomingAttacks.filter((a) => {
      if (a.endsAt == null || a.endsAt > now) return true;
      completedIncomingIds.push(a.id);
      return false;
    });
    if (nextIncoming.length !== state.incomingAttacks.length) {
      set({ incomingAttacks: nextIncoming });
    }
    completedIncomingIds.forEach((id) => get()._completeIncomingAttack(id));
  },

  _completeConstruction: (cityId, itemId) => {
    const state = get();
    const city = state.cities[cityId];
    if (!city) return;

    const queue = [...city.constructionQueue];
    const activeIdx = queue.findIndex((q) => q.id === itemId);
    if (activeIdx === -1) return;

    const item = queue[activeIdx];
    const buildings = city.buildings.map((b) => {
      if (b.id !== item.buildingId && b.name !== item.name) return b;
      const nextLevel = item.targetLevel ?? b.level + 1;
      const unlockPanel = PANEL_LOCKED_BUILDING_IDS.includes(b.id);
      const upgraded = { ...b, level: nextLevel };
      const nextSpec = resolveNextConstructionSpec(upgraded);
      return {
        ...b,
        level: nextLevel,
        built: true,
        upgrading: false,
        locked: unlockPanel ? false : b.locked,
        cost: nextSpec?.cost ?? '—',
        time: nextSpec?.time ?? '—',
      };
    });

    const vipMult = getVipMultiplierFromState(get());
    const resources = applyProductionFreeze(
      recalculateResourceRates(buildings, city.resources),
      buildings,
      city,
      vipMult,
    );
    queue.splice(activeIdx, 1);

    patchCity(set, get, cityId, { buildings, resources, constructionQueue: queue });

    const resId = BUILDING_RESOURCE_MAP[item.buildingId];
    const newRate = resId ? resources.find((r) => r.id === resId)?.rate : null;
    useNotificationStore.getState().addToast(
      `İnşaat Tamamlandı: ${item.name}${newRate ? ` · Üretim ${newRate}` : ''}`,
      'success',
    );
    cloudSync(get, { cityId, saveAllUnits: true });
  },

  _completeProduction: (cityId, itemId) => {
    const state = get();
    const city = state.cities[cityId];
    if (!city) return;

    const queue = [...city.productionQueue];
    const activeIdx = queue.findIndex((q) => q.id === itemId);
    if (activeIdx === -1) return;

    const item = queue[activeIdx];
    const idleTroops = city.idleTroops.map((t) => {
      if (t.id !== item.unitId && t.name !== item.unit) return t;
      return { ...t, available: t.available + item.count };
    });

    queue.splice(activeIdx, 1);

    patchCity(set, get, cityId, { idleTroops, productionQueue: queue });
    useNotificationStore.getState().addToast(
      `Üretim Tamamlandı: ${item.count} ${item.unit}`,
      'success',
    );
    cloudSync(get, { cityId, saveAllUnits: true });
  },

  _completeExpedition: (expeditionId) => {
    const state = get();
    const exp = state.expeditions.find((e) => e.id === expeditionId);
    if (!exp) return;

    const syncExp = (extra = {}) => {
      cloudSync(get, {
        immediate: true,
        expeditionIdsToComplete: [expeditionId],
        syncAllExpeditions: true,
        cityId: exp.originCityId || get().activeCityId,
        saveAllUnits: true,
        ...extra,
      });
    };

    const isReturnLeg =
      exp.direction === 'returning'
      || exp.recalled
      || exp.skipCombat
      || exp.type === 'Geri Dönüş';

    if (exp.mode === 'found' && exp.direction === 'outgoing') {
      get()._completeFoundCity(expeditionId);
      syncExp();
      return;
    }

    if (isReturnLeg) {
      const cityId = exp.originCityId || state.activeCityId;
      const city = state.cities[cityId];
      const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);

      if (city && exp.mode === 'trade' && exp.tradePayload?.resources) {
        const { resources, overflow } = applyTradeDelivery(
          city.resources,
          exp.tradePayload.resources,
        );
        patchCity(set, get, cityId, { resources });
        set({
          expeditions,
          navBadges: { ...state.navBadges, expeditions: expeditions.length > 0 },
        });
        useNotificationStore.getState().addToast(
          `Ticaret kargosu ${state.playerCities.find((c) => c.id === cityId)?.name ?? 'üse'} iade edildi`,
          overflow.length ? 'warn' : 'success',
        );
        syncExp();
        return;
      }

      if (city && exp.troopPayload) {
        const restored = restoreTroopsToCity(city, exp.troopPayload);
        set({
          cities: {
            ...state.cities,
            [cityId]: {
              ...city,
              idleTroops: restored.idleTroops,
              idleSpies: restored.idleSpies ?? city.idleSpies,
            },
          },
          expeditions,
          navBadges: {
            ...state.navBadges,
            expeditions: expeditions.length > 0,
          },
        });
      } else {
        set({
          expeditions,
          navBadges: {
            ...state.navBadges,
            expeditions: expeditions.length > 0,
          },
        });
      }
      useNotificationStore.getState().addToast(
        exp.mode === 'trade'
          ? 'Ticaret konvoyu üsse döndü'
          : `Ordu ${state.playerCities.find((c) => c.id === cityId)?.name ?? 'şehre'} döndü`,
        'success',
      );
      syncExp();
      return;
    }

    if (exp.mode === 'trade' && exp.direction === 'outgoing') {
      const targetPc = state.playerCities.find(
        (c) => c.id === exp.targetCityId || c.name === exp.target,
      );
      const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
      let overflow = [];

      if (targetPc && exp.tradePayload?.resources) {
        const targetCity = state.cities[targetPc.id];
        if (targetCity) {
          const delivered = applyTradeDelivery(targetCity.resources, exp.tradePayload.resources);
          overflow = delivered.overflow;
          patchCity(set, get, targetPc.id, { resources: delivered.resources });
        }
      }

      const report = generateTradeReport(exp, true, overflow);
      set({
        expeditions,
        reports: [report, ...state.reports],
        navBadges: {
          expeditions: expeditions.length > 0,
          reports: true,
        },
      });
      useNotificationStore.getState().addToast(
        overflow.length ? 'Kargo teslim — depo taşması oluştu' : 'Ticaret kargosu teslim edildi',
        overflow.length ? 'warn' : 'success',
      );
      syncExp({ reports: [report] });
      return;
    }

    const isKbrn = exp.mode === 'kbrn' || exp.type?.toLowerCase().includes('kbrn');
    const isCyber = !isKbrn && (exp.mode === 'cyber' || exp.type?.toLowerCase().includes('siber virüs'));
    const isSpy = !isKbrn && !isCyber && exp.type.toLowerCase().includes('casus');
    const cityId = exp.originCityId || state.activeCityId;
    const city = state.cities[cityId];

    if (isKbrn) {
      const mapCity = state.mapCities.find((c) => c.name === exp.target);
      const originCity = state.cities[cityId];
      const agentCount = exp.troopPayload?.kbrn?.agents ?? 2;
      const targetPc = state.playerCities.find((c) => c.name === exp.target);
      const defenderCity = targetPc ? state.cities[targetPc.id] : null;
      const defenderResearches = targetPc
        ? state.researches
        : generateBotKbrnResearches(mapCity);

      const kbrnResult = resolveKbrnChemMission({
        expedition: exp,
        attackerResearches: state.researches,
        defenderResearches,
        defenderCity,
        mapCity,
        agentCount,
        attackerName: getCurrentPlayerName(),
      });

      const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
      const reportsToAdd = [kbrnResult.report];

      if (targetPc && defenderCity) {
        const alert = buildKbrnDefenderAlertReport({
          target: exp.target,
          roll: kbrnResult.roll,
          attackerTrace: kbrnResult.attackerTrace,
          effectApplied: Boolean(kbrnResult.effect),
        });
        reportsToAdd.push(alert);
      }

      const cityPatches = {};
      if (originCity && kbrnResult.agentsReturned > 0) {
        cityPatches[cityId] = {
          ...originCity,
          idleAgents: (originCity.idleAgents ?? 0) + kbrnResult.agentsReturned,
        };
      }

      if (kbrnResult.success && kbrnResult.effect && targetPc && defenderCity) {
        const nextTarget = refreshCityMorale(
          {
            ...state,
            cities: {
              ...state.cities,
              [targetPc.id]: {
                ...defenderCity,
                kbrnEffects: [...(defenderCity.kbrnEffects ?? []), kbrnResult.effect],
              },
            },
          },
          targetPc.id,
        );
        cityPatches[targetPc.id] = nextTarget;
      }

      set({
        expeditions,
        reports: [...reportsToAdd, ...state.reports],
        navBadges: { expeditions: expeditions.length > 0, reports: true },
        ...(Object.keys(cityPatches).length
          ? { cities: { ...state.cities, ...cityPatches } }
          : {}),
      });

      useNotificationStore.getState().addToast(
        kbrnResult.success
          ? `[ KBRN OPS LEDGER ]: SUCCESS — ${exp.target}`
          : '[ KBRN OPS LEDGER ]: FAILED — panzehir etkisiz kıldı',
        kbrnResult.success ? 'warn' : 'info',
      );
      syncExp({ reports: reportsToAdd });
      if (targetPc && kbrnResult.effect) {
        cloudSync(get, { cityId: targetPc.id });
      }
      return;
    }

    if (isCyber) {
      const mapCity = state.mapCities.find((c) => c.name === exp.target);
      const originCity = state.cities[cityId];
      const abilityId = exp.troopPayload?.cyberVirus?.abilityId;
      const agentCount = exp.troopPayload?.cyberVirus?.agents ?? 1;
      const targetPc = state.playerCities.find((c) => c.name === exp.target);
      const defenderCity = targetPc ? state.cities[targetPc.id] : null;

      const cyberResult = resolveCyberVirusMission({
        expedition: exp,
        attackerCity: originCity,
        defenderCity,
        mapCity,
        abilityId,
        agentCount,
        attackerName: getCurrentPlayerName(),
      });

      const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
      const reportsToAdd = [cyberResult.report];
      const logEntry = buildCyberOpsLogEntry({
        ability: { id: abilityId, name: cyberResult.report.cyberLedger?.abilityName ?? abilityId },
        originCityName: exp.originCityName,
        targetCityName: exp.target,
        success: cyberResult.success,
      });

      const cityPatches = {};
      if (originCity && cyberResult.agentsReturned > 0) {
        cityPatches[cityId] = {
          ...originCity,
          idleAgents: (originCity.idleAgents ?? 0) + cyberResult.agentsReturned,
        };
      }

      if (cyberResult.success && cyberResult.effect && targetPc && defenderCity) {
        const nextTarget = refreshCityMorale(
          {
            ...state,
            cities: {
              ...state.cities,
              [targetPc.id]: {
                ...defenderCity,
                cyberEffects: [...(defenderCity.cyberEffects ?? []), cyberResult.effect],
              },
            },
          },
          targetPc.id,
        );
        cityPatches[targetPc.id] = nextTarget;
      }

      set({
        expeditions,
        reports: [...reportsToAdd, ...state.reports],
        navBadges: { expeditions: expeditions.length > 0, reports: true },
        cyberOpsLog: [logEntry, ...(state.cyberOpsLog ?? [])].slice(0, 40),
        ...(Object.keys(cityPatches).length
          ? { cities: { ...state.cities, ...cityPatches } }
          : {}),
      });

      useNotificationStore.getState().addToast(
        cyberResult.success
          ? `[ CYBER OPS LEDGER ]: SUCCESS — ${exp.target}`
          : `[ CYBER OPS LEDGER ]: FAILED — virüs temizlendi`,
        cyberResult.success ? 'intel' : 'warn',
      );
      syncExp({ reports: reportsToAdd });
      if (targetPc && cyberResult.effect) {
        cloudSync(get, { cityId: targetPc.id });
      }
      return;
    }

    if (isSpy) {
      const mapCity = state.mapCities.find((c) => c.name === exp.target);
      const originCity = state.cities[cityId];
      const spyResult = resolveSpyMission({
        expedition: exp,
        attackerContext: {
          researches: state.researches,
          buildings: originCity?.buildings ?? [],
        },
        defenderContext: {
          mapCity,
          resources: resolveDefenderDepot(mapCity),
          buildings: generateDefenderBuildings(mapCity),
          troops: resolveDefenderArmy(mapCity),
          researches: generateBotResearches(mapCity),
        },
        attackerName: getCurrentPlayerName(),
      });

      const reportsToAdd = [spyResult.report];
      if (spyResult.battleReport) {
        reportsToAdd.push(spyResult.battleReport);
      }

      if (originCity) {
        const returned = spyResult.spiesReturned ?? 0;
        if (returned > 0) {
          patchCity(set, get, cityId, {
            idleSpies: (originCity.idleSpies ?? 0) + returned,
          });
        }
      }

      const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
      set({
        expeditions,
        reports: [...reportsToAdd, ...state.reports],
        navBadges: { expeditions: expeditions.length > 0, reports: true },
      });

      useNotificationStore.getState().addToast(
        spyResult.caught
          ? 'Giriş Engellendi — Sonda yakalandı, çatışma çıktı!'
          : spyResult.depth >= 3
            ? '[ INTELLIGENCE REPORT ] alındı'
            : 'Casusluk sondası tamamlandı',
        spyResult.caught ? 'danger' : 'intel',
      );
      syncExp({ reports: reportsToAdd });
      return;
    }

    const mapCity = state.mapCities.find((c) => c.name === exp.target);
    const spyReport = findSpyReportForCity(state.reports, exp.target);
    const defenderCounts = resolveDefenderArmy(mapCity, {
      spyEnemyTroops: getEnemyTroopsFromReport(spyReport),
    });
    const attackerCounts = exp.troopPayload && !exp.troopPayload.spies
      ? exp.troopPayload
      : {};
    const combat = runCombat(attackerCounts, defenderCounts);
    const defenderResources = resolveDefenderDepot(mapCity);
    const loot = combat.attackerWon ? calcRaidLoot(defenderResources, LOOT_RATE) : [];

    const report = buildCombatReport({
      expedition: exp,
      combat,
      loot,
      attackerName: getCurrentPlayerName(),
      defenderName: mapCity?.owner || exp.target,
    });

    if (city && loot.length > 0) {
      const { resources, overflow } = applyExpeditionLoot(city.resources, loot);
      const vipMult = getVipMultiplierFromState(get());
      const frozenResources = applyProductionFreeze(resources, city.buildings, city, vipMult);
      patchCity(set, get, cityId, { resources: frozenResources });
      if (overflow.length > 0) {
        useNotificationStore.getState().addToast(
          `Depo taştı — ${overflow.map((o) => `${o.amount} ${o.label}`).join(', ')}`,
          'warn',
        );
      }
    }

    const origin = resolveCityCoords(exp.originCityName, state.playerCities, state.mapCities);
    const targetCoords = { lat: exp.targetLat, lng: exp.targetLng };
    const returnDuration = calcExpeditionTravelSeconds({
      origin: targetCoords,
      target: origin,
      troopQty: combat.survivingAttacker,
      mapCities: state.mapCities,
      mode: 'attack',
    });
    const returnTiming = createQueueTiming(returnDuration);
    const pseudoIdle = landUnits.map((u) => ({
      ...u,
      available: combat.survivingAttacker[u.id] || 0,
    }));
    const survivorTotal = Object.values(combat.survivingAttacker).reduce((a, b) => a + b, 0);

    let expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
    if (survivorTotal > 0) {
      expeditions = [
        ...expeditions,
        {
          ...exp,
          id: genId('exp'),
          direction: 'returning',
          type: 'Geri Dönüş',
          troops: formatTroopsSummary(combat.survivingAttacker, pseudoIdle),
          troopPayload: { ...combat.survivingAttacker },
          skipCombat: true,
          recalled: false,
          ...returnTiming,
        },
      ];
    }

    const pastExpeditions = [
      {
        id: genId('past'),
        target: exp.target,
        result: combat.attackerWon ? 'Zafer' : 'Yenilgi',
        loot: loot.length ? loot.map((l) => `${l.amount} ${l.label}`).join(', ') : '—',
        date: report.date,
      },
      ...state.pastExpeditions,
    ];

    set({
      expeditions,
      reports: [report, ...state.reports],
      pastExpeditions,
      navBadges: {
        expeditions: expeditions.length > 0,
        reports: true,
      },
    });

    useNotificationStore.getState().addToast(
      combat.attackerWon
        ? `[ COMBAT LEDGER ]: WIN — Ganimet toplandı`
        : '[ COMBAT LEDGER ]: LOSS — Birlikler geri çekiliyor',
      combat.attackerWon ? 'success' : 'danger',
    );
    syncExp({ reports: [report] });
  },

  _completeFoundCity: (expeditionId) => {
    const state = get();
    const exp = state.expeditions.find((e) => e.id === expeditionId);
    if (!exp) return;

    const mapPlotMatch = (c) =>
      (exp.targetLat != null && c.lat === exp.targetLat && c.lng === exp.targetLng)
      || (exp.sourceMapCityName && c.name === exp.sourceMapCityName);

    const mapEntry = state.mapCities.find(mapPlotMatch);
    let cityId = slugCityId(exp.target);
    if (state.cities[cityId] || state.playerCities.some((c) => c.id === cityId)) {
      cityId = genId('city');
    }

    const troopPayload = exp.troopPayload && !exp.troopPayload.spies ? exp.troopPayload : {};
    const newPlayerCity = {
      id: cityId,
      name: exp.target,
      province: mapEntry?.province ?? '—',
      provinceName: mapEntry?.provinceName,
      type: mapEntry?.type ? `${mapEntry.type} Şehri` : 'Kıyı Şehri',
      lat: exp.targetLat ?? mapEntry?.lat,
      lng: exp.targetLng ?? mapEntry?.lng,
    };

    const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);

    set({
      playerCities: [...state.playerCities, newPlayerCity],
      cities: {
        ...state.cities,
        [cityId]: createFoundCityState(troopPayload),
      },
      mapCities: state.mapCities.map((c) =>
        mapPlotMatch(c)
          ? {
              ...c,
              name: exp.target,
              status: 'own',
              owner: getCurrentPlayerName(),
              population: c.population || 1200,
            }
          : c,
      ),
      expeditions,
      navBadges: {
        ...state.navBadges,
        expeditions: expeditions.length > 0,
      },
    });

    useNotificationStore.getState().addToast(
      `${exp.target} kuruldu — şehir listenize eklendi`,
      'success',
    );
  },

  _completeIncomingAttack: (attackId) => {
    const state = get();
    const attack = state.incomingAttacks.find((a) => a.id === attackId);
    if (!attack) return;
    const cityName = state.playerCities.find((c) => c.id === attack.targetCityId)?.name ?? attack.targetCityId;
    useNotificationStore.getState().addToast(
      `${cityName} şehrinize saldırı ulaştı!`,
      'danger',
    );
  },

  recallExpedition: (expeditionId) => {
    const now = Date.now();
    const state = get();
    const exp = state.expeditions.find((e) => e.id === expeditionId);
    if (!exp || exp.direction !== 'outgoing') return false;

    const remaining = remainingFromEndsAt(exp.endsAt, now);
    if (remaining <= 0) return false;

    const elapsedSeconds = exp.startedAt
      ? Math.max(1, Math.ceil((now - exp.startedAt) / 1000))
      : Math.max(1, (exp.durationSeconds || remaining) - remaining);
    const returnTiming = createQueueTiming(elapsedSeconds);
    const originName =
      state.playerCities.find((c) => c.id === exp.originCityId)?.name ?? exp.originCityName;
    const updated = {
      ...exp,
      direction: 'returning',
      type: 'Geri Dönüş',
      originalTarget: exp.originalTarget ?? exp.target,
      target: originName ?? exp.originCityId ?? 'Şehir',
      recalled: true,
      skipCombat: true,
      ...returnTiming,
    };

    set({
      expeditions: state.expeditions.map((e) => (e.id === expeditionId ? updated : e)),
      navBadges: { ...state.navBadges, expeditions: true },
    });

    useNotificationStore.getState().addToast(
      `Ordu geri çağrıldı — ${formatSeconds(elapsedSeconds)} sonra şehre varır`,
      'info',
    );
    return true;
  },

  declareMeydanBattle: (targetCityName) => {
    const state = get();
    if (state.meydanBattle?.status === 'preparing') {
      useNotificationStore.getState().addToast('Zaten aktif bir Meydan Savaşı hazırlığı var', 'warn');
      return false;
    }
    const target = state.mapCities.find(
      (c) => c.name === targetCityName && c.status !== 'own',
    );
    if (!target) {
      useNotificationStore.getState().addToast('Geçerli bir düşman veya boş hedef seçin', 'warn');
      return false;
    }
    const now = Date.now();
    set({
      meydanBattle: {
        id: genId('meydan'),
        targetName: targetCityName,
        targetLat: target.lat,
        targetLng: target.lng,
        declaredAt: now,
        battleAt: getMeydanBattleAt(now),
        status: 'preparing',
        contributions: [],
      },
    });
    useNotificationStore.getState().addToast(
      `Meydan Savaşı ilan edildi: ${targetCityName} — ${formatSeconds(MEYDAN_PREP_SECONDS)} hazırlık`,
      'info',
    );
    return true;
  },

  contributeMeydanTroops: (troopQty) => {
    const state = get();
    const battle = state.meydanBattle;
    if (!battle || battle.status !== 'preparing') return false;
    if (!canRecallMeydanTroops(battle)) {
      useNotificationStore.getState().addToast('Son 5 dakika — birlik gönderilemez', 'warn');
      return false;
    }

    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const total = Object.values(troopQty || {}).reduce((a, b) => a + (b || 0), 0);
    if (total < 1) return false;
    for (const t of city.idleTroops) {
      if ((troopQty[t.id] || 0) > t.available) return false;
    }

    const idleTroops = city.idleTroops.map((t) => ({
      ...t,
      available: Math.max(0, t.available - (troopQty[t.id] || 0)),
    }));
    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const existing = battle.contributions.find((c) => c.cityId === cityId);
    const contributions = existing
      ? battle.contributions.map((c) => {
          if (c.cityId !== cityId) return c;
          const merged = { ...c.troopQty };
          for (const [id, qty] of Object.entries(troopQty)) {
            merged[id] = (merged[id] || 0) + (qty || 0);
          }
          return {
            ...c,
            troopQty: merged,
            troops: formatTroopsSummary(merged, city.idleTroops),
          };
        })
      : [
          ...battle.contributions,
          {
            id: genId('mc'),
            cityId,
            originCityName,
            troopQty: { ...troopQty },
            troops: formatTroopsSummary(troopQty, city.idleTroops),
            committedAt: Date.now(),
          },
        ];

    set({
      meydanBattle: { ...battle, contributions },
      cities: { ...state.cities, [cityId]: { ...city, idleTroops } },
    });
    useNotificationStore.getState().addToast(
      `Meydan Savaşı — ${originCityName} birlikleri ${battle.targetName} seferine eklendi`,
      'success',
    );
    return true;
  },

  recallMeydanContribution: (contributionId) => {
    const state = get();
    const battle = state.meydanBattle;
    if (!battle || battle.status !== 'preparing') return false;
    if (!canRecallMeydanTroops(battle)) {
      useNotificationStore.getState().addToast(
        'Son 5 dakika — ordular kilitlendi, geri çekilemez',
        'warn',
      );
      return false;
    }

    const contribution = battle.contributions.find((c) => c.id === contributionId);
    if (!contribution) return false;

    const city = state.cities[contribution.cityId];
    if (city) {
      const idleTroops = city.idleTroops.map((t) => ({
        ...t,
        available: t.available + (contribution.troopQty[t.id] || 0),
      }));
      patchCity(set, get, contribution.cityId, { idleTroops });
    }

    set({
      meydanBattle: {
        ...battle,
        contributions: battle.contributions.filter((c) => c.id !== contributionId),
      },
    });
    useNotificationStore.getState().addToast('Meydan birlikleri geri çekildi', 'info');
    return true;
  },

  _resolveMeydanBattle: () => {
    const state = get();
    const battle = state.meydanBattle;
    if (!battle || battle.status !== 'preparing') return;

    const totalUnits = battle.contributions.reduce(
      (sum, c) => sum + Object.values(c.troopQty || {}).reduce((a, b) => a + (b || 0), 0),
      0,
    );
    const report = {
      id: genId('rep'),
      type: 'battle',
      title: `Meydan Savaşı — ${battle.targetName}`,
      date: nowReportDate(),
      isNew: true,
      winner: totalUnits > 0 ? 'player' : 'enemy',
      targetCity: battle.targetName,
      summary: totalUnits > 0
        ? `${totalUnits} birlik ile istila tamamlandı.`
        : 'Hiçbir birlik gönderilmedi — savaş iptal edildi.',
    };

    set({
      meydanBattle: null,
      reports: [report, ...state.reports],
      navBadges: { ...state.navBadges, reports: true },
    });
    useNotificationStore.getState().addToast(
      `Meydan Savaşı sonuçlandı: ${battle.targetName}`,
      'success',
    );
  },

  markReportsRead: (reportIds) => {
    const state = get();
    const idSet = new Set(reportIds);
    if (!idSet.size) return;
    const reports = state.reports.map((r) => (idSet.has(r.id) ? { ...r, isNew: false } : r));
    const hasUnread = reports.some((r) => r.isNew);
    set({
      reports,
      navBadges: { ...state.navBadges, reports: hasUnread },
    });
  },

  markAllReportsRead: () => {
    get().markReportsRead(get().reports.map((r) => r.id));
  },

  deleteReports: (ids) => {
    const idSet = ids === 'all' ? null : new Set(ids);
    set((s) => {
      const reports = idSet ? s.reports.filter((r) => !idSet.has(r.id)) : [];
      const hasUnread = reports.some((r) => r.isNew);
      return {
        reports,
        navBadges: {
          ...s.navBadges,
          reports: hasUnread,
        },
      };
    });
    useNotificationStore.getState().addToast('Raporlar silindi', 'info');
  },

  enqueueConstruction: (buildingId, { addToQueue = false } = {}) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const building = city.buildings.find((b) => b.id === buildingId);
    if (!building) return false;

    const spec = resolveNextConstructionSpec(building);
    if (!spec?.cost) return false;

    if (city.constructionQueue.length >= CONSTRUCTION_QUEUE_LIMIT) return false;
    if (!canAffordCost(spec.cost, 1, city.resources)) return false;
    if (!arePrerequisitesMet(city, buildingId)) return false;

    const hasActive = city.constructionQueue.some((q) => !q.queued);
    const queued = addToQueue || hasActive;
    const duration = parseTimeToSeconds(spec.time) || 120;
    const timing = queued
      ? { durationSeconds: duration, startedAt: null, endsAt: null }
      : createQueueTiming(duration);

    const item = {
      id: genId('cq'),
      buildingId: building.id,
      name: building.name,
      targetLevel: spec.targetLevel,
      costPaid: spec.cost,
      costQty: 1,
      queued,
      ...timing,
    };

    const resources = deductCost(spec.cost, 1, city.resources);
    const unlockOnStart = PANEL_LOCKED_BUILDING_IDS.includes(buildingId);
    const buildings = city.buildings.map((b) => {
      if (b.id !== buildingId) return b;
      return {
        ...b,
        upgrading: !queued,
        locked: unlockOnStart ? false : b.locked,
      };
    });

    patchCity(set, get, cityId, {
      resources,
      buildings,
      constructionQueue: [...city.constructionQueue, item],
    });

    useNotificationStore.getState().addToast(
      queued ? `${building.name} kuyruğa eklendi` : `${building.name} yükseltmesi başladı`,
      'success',
    );
    cloudSync(get, { cityId });
    return true;
  },

  enqueueProduction: (unitId, count, { addToQueue = false } = {}) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const unitDef = city.idleTroops.find((t) => t.id === unitId);
    if (!unitDef || !count || count <= 0) return false;

    const barracks = city.buildings.find((b) => b.id === 'barracks');
    if (!barracks || barracks.level < 1) return false;

    const unitMeta = landUnits.find((u) => u.id === unitId);
    if (!unitMeta) return false;
    const costStr = unitMeta.cost;

    if (!canAffordCost(costStr, count, city.resources)) return false;

    const popCost = getUnitPopulationCost(unitId, count);
    if (!canAffordPopulation(city, popCost)) return false;

    const hasActive = city.productionQueue.some((q) => !q.queued);
    const queued = addToQueue || hasActive;
    const baseDuration = parseTimeToSeconds(unitMeta.time) || 30;
    const happyMult = getHappinessProductionSpeedMultiplier(city.happiness ?? 100);
    const barracksSlow = 1
      + getActiveCyberBarracksSlow(city.cyberEffects)
      + getActiveKbrnBarracksBlock(city.kbrnEffects);
    const scaledDuration = Math.max(
      5,
      Math.round((baseDuration * count * barracksSlow) / Math.max(0.15, happyMult)),
    );
    const timing = queued
      ? { durationSeconds: scaledDuration, startedAt: null, endsAt: null }
      : createQueueTiming(scaledDuration);

    const item = {
      id: genId('pq'),
      unitId,
      unit: unitDef.name,
      count,
      costPaid: costStr,
      costQty: count,
      popCost,
      queued,
      ...timing,
    };

    const resources = deductCost(costStr, count, city.resources);
    const withPop = deductPopulation({ ...city, resources }, popCost);
    patchCity(set, get, cityId, {
      resources: withPop.resources,
      idlePopulation: withPop.idlePopulation,
      productionQueue: [...city.productionQueue, item],
    });

    useNotificationStore.getState().addToast(
      queued ? `${count} ${unitDef.name} kuyruğa eklendi` : `${count} ${unitDef.name} üretiliyor`,
      'success',
    );
    cloudSync(get, { cityId, saveAllUnits: true });
    return true;
  },

  startExpedition: ({ targetCity, troopQty, mode = 'attack', newCityName }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const isSpy = mode === 'spy';
    const isFound = mode === 'found';
    const spyCount = troopQty?.spies ?? 0;

    const isOwnPlayerCity = state.playerCities.some((pc) => pc.name === targetCity.name);
    if (!isFound && isOwnPlayerCity && (isSpy || mode === 'attack')) return false;

    if (isFound) {
      if (targetCity.status !== 'empty') return false;
      if (state.playerCities.some((c) => c.name === targetCity.name)) return false;
      const colonists = troopQty[FOUND_CITY_COLONIST_ID] || 0;
      if (colonists < FOUND_CITY_MIN_COLONISTS) return false;
      if (!canAffordCost(FOUND_CITY_COST, 1, city.resources)) return false;
      const colonistTroop = city.idleTroops.find((t) => t.id === FOUND_CITY_COLONIST_ID);
      if (!colonistTroop || colonists > colonistTroop.available) return false;
    } else if (isSpy) {
      if (spyCount < 1 || spyCount > city.idleSpies) return false;
    } else {
      const total = Object.values(troopQty).reduce((a, b) => a + (b || 0), 0);
      if (total < 1) return false;
      for (const t of city.idleTroops) {
        if ((troopQty[t.id] || 0) > t.available) return false;
      }
    }

    const troops = formatTroopsSummary(troopQty, city.idleTroops);
    const idleTroops = city.idleTroops.map((t) => ({
      ...t,
      available: Math.max(0, t.available - (troopQty[t.id] || 0)),
    }));
    const idleSpies = isSpy ? Math.max(0, city.idleSpies - spyCount) : city.idleSpies;

    let resources = city.resources;
    if (isFound) {
      resources = deductCost(FOUND_CITY_COST, 1, city.resources);
    }

    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const foundTargetName = isFound
      ? resolveFoundCityName(newCityName, state.playerCities.map((c) => c.name))
      : targetCity.name;
    const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const targetCoords = { lat: targetCity.lat, lng: targetCity.lng };
    const expeditionMode = isFound ? 'found' : isSpy ? 'spy' : 'attack';
    const duration = isSpy
      ? calcSpyProbeTravelSeconds({
        origin,
        target: targetCoords,
        spyCount,
        mapCities: state.mapCities,
      })
      : calcExpeditionTravelSeconds({
        origin,
        target: targetCoords,
        troopQty,
        mapCities: state.mapCities,
        mode: expeditionMode,
      });
    const distKm = getExpeditionDistanceKm(origin, targetCoords);
    const timing = createQueueTiming(duration);

    const expedition = {
      id: genId('exp'),
      originCityId: cityId,
      originCityName,
      target: foundTargetName,
      sourceMapCityName: isFound ? targetCity.name : undefined,
      targetLat: targetCity.lat,
      targetLng: targetCity.lng,
      mode: expeditionMode,
      type: isFound ? 'Şehir Kur' : isSpy ? 'Casusluk Sondası' : 'Saldırı',
      direction: 'outgoing',
      troops: isSpy ? `${spyCount} Casus` : troops,
      troopPayload: isSpy ? { spies: spyCount } : { ...troopQty },
      player: 'Komutan_Alpha',
      units: isSpy ? spyCount : Object.values(troopQty || {}).reduce((a, b) => a + (b || 0), 0),
      distance: formatDistanceKm(distKm),
      airRush: !isSpy && isAirOnlyExpedition(troopQty),
      ...timing,
    };

    set((s) => ({
      cities: {
        ...s.cities,
        [cityId]: { ...s.cities[cityId], idleTroops, idleSpies, resources },
      },
      expeditions: [...s.expeditions, expedition],
      navBadges: { ...s.navBadges, expeditions: true },
    }));

    useNotificationStore.getState().addToast(
      isFound
        ? `Şehir kurma seferi: ${foundTargetName}`
        : isSpy
          ? `Casuslar ${targetCity.name} yolunda`
          : `Sefer başlatıldı: ${targetCity.name}`,
      'info',
    );

    const latest = get().expeditions.find((e) => e.id === expedition.id) ?? expedition;
    cloudSync(get, {
      cityId,
      immediate: true,
      expedition: latest,
      saveAllUnits: true,
    });
    return true;
  },

  startTradeExpedition: ({ targetCityName, sendAmounts }) => {
    const total = sumTradeAmounts(sendAmounts);
    if (total <= 0) {
      useNotificationStore.getState().addToast('Gönderilecek kaynak seçin', 'warn');
      return false;
    }

    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const targetPc = state.playerCities.find((c) => c.name === targetCityName);
    if (!targetPc || targetPc.id === cityId) {
      useNotificationStore.getState().addToast('Geçerli bir hedef şehir seçin', 'warn');
      return false;
    }
    if (!canAffordTrade(city.resources, sendAmounts)) {
      useNotificationStore.getState().addToast('Yetersiz kaynak', 'warn');
      return false;
    }

    const market = city.buildings?.find((b) => b.id === 'market');
    if (!market || market.level < 1) {
      useNotificationStore.getState().addToast(
        'Ticaret için önce Pazar Yeri inşa edilmeli (Binalar)',
        'warn',
      );
      return false;
    }

    const resources = deductTradeResources(city.resources, sendAmounts);
    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const mapTarget = state.mapCities.find((c) => c.name === targetCityName);
    const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const targetCoords = mapTarget
      ? { lat: mapTarget.lat, lng: mapTarget.lng }
      : resolveCityCoords(targetCityName, state.playerCities, state.mapCities);
    const duration = calcExpeditionTravelSeconds({
      origin,
      target: targetCoords,
      troopQty: {},
      mapCities: state.mapCities,
      mode: 'trade',
    });
    const distKm = getExpeditionDistanceKm(origin, targetCoords);
    const timing = createQueueTiming(duration);

    const expedition = {
      id: genId('exp'),
      originCityId: cityId,
      originCityName,
      targetCityId: targetPc.id,
      target: targetCityName,
      targetLat: mapTarget?.lat ?? targetPc.lat,
      targetLng: mapTarget?.lng ?? targetPc.lng,
      mode: 'trade',
      type: 'Ticaret Konvoyu',
      direction: 'outgoing',
      troops: formatTradeCargoSummary(sendAmounts),
      tradePayload: { resources: { ...sendAmounts } },
      troopPayload: null,
      player: 'Komutan_Alpha',
      units: 1,
      distance: formatDistanceKm(distKm),
      ...timing,
    };

    set((s) => ({
      cities: { ...s.cities, [cityId]: { ...city, resources } },
      expeditions: [...s.expeditions, expedition],
      navBadges: { ...s.navBadges, expeditions: true },
    }));

    useNotificationStore.getState().addToast(
      `Ticaret konvoyu ${targetCityName} yolunda`,
      'info',
    );
    cloudSync(get, {
      cityId,
      immediate: true,
      expedition: get().expeditions.find((e) => e.id === expedition.id) ?? expedition,
    });
    return true;
  },

  sendIntelOperation: ({ target, opType, agentCount = 1 }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const intel = city.buildings?.find((b) => b.id === 'intel');
    if (!intel || intel.level < 1) return false;
    if ((city.idleAgents ?? 0) < agentCount) return false;

    const popCost = getAgentPopulationCost(agentCount);
    if (!canAffordPopulation(city, popCost)) return false;

    const duration = 40 + Math.floor(Math.random() * 25);
    const timing = createQueueTiming(duration);
    const op = {
      id: genId('iop'),
      originCityId: cityId,
      target,
      opType,
      agentCount,
      ...timing,
    };

    const withPop = deductPopulation(
      { ...city, idleAgents: (city.idleAgents ?? 0) - agentCount },
      popCost,
    );

    patchCity(set, get, cityId, {
      idleAgents: withPop.idleAgents,
      idlePopulation: withPop.idlePopulation,
    });

    set({
      intelOperations: [...(state.intelOperations ?? []), op],
    });

    useNotificationStore.getState().addToast(
      `${agentCount} ajan — ${opType} (${target})`,
      'intel',
    );
    return true;
  },

  _completeIntelOperation: (opId) => {
    const state = get();
    const op = (state.intelOperations ?? []).find((o) => o.id === opId);
    if (!op) return;

    const success = Math.random() > 0.38;
    const agentsLost = success ? 0 : op.agentCount;
    const report = generateAgentReport(op, success, agentsLost);
    const intelOperations = (state.intelOperations ?? []).filter((o) => o.id !== opId);

    set({
      intelOperations,
      reports: [report, ...state.reports],
      navBadges: { ...state.navBadges, reports: true },
    });

    if (agentsLost > 0) {
      useNotificationStore.getState().addToast(
        `SİBER ALARM: ${agentsLost} ajan imha edildi — ${op.target}`,
        'danger',
      );
    } else {
      useNotificationStore.getState().addToast(
        success ? 'Ajan operasyonu raporu geldi' : 'Operasyon başarısız',
        success ? 'intel' : 'warn',
      );
    }
  },

  requestMapTradeFocus: (expeditionId) => {
    const state = get();
    const exp = state.expeditions.find((e) => e.id === expeditionId);
    if (!exp || exp.mode !== 'trade') return;
    set({
      mapFocusRequest: {
        expeditionId,
        originCityId: exp.originCityId,
        targetName: exp.target,
        at: Date.now(),
      },
    });
  },

  clearMapFocusRequest: () => set({ mapFocusRequest: null }),

  speedUpConstruction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    const item = city.constructionQueue.find((q) => q.id === queueId);
    if (!item || item.queued) return;
    patchCity(set, get, cityId, {
      constructionQueue: city.constructionQueue.map((q) =>
        q.id === queueId ? { ...q, endsAt: Date.now() } : q,
      ),
    });
    get().tick();
  },

  speedUpProduction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    const item = city.productionQueue.find((q) => q.id === queueId);
    if (!item || item.queued) return;
    patchCity(set, get, cityId, {
      productionQueue: city.productionQueue.map((q) =>
        q.id === queueId ? { ...q, endsAt: Date.now() } : q,
      ),
    });
    get().tick();
  },

  startQueuedConstruction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    if (city.constructionQueue.some((q) => !q.queued)) return false;
    const item = city.constructionQueue.find((q) => q.id === queueId && q.queued);
    if (!item) return false;
    const duration = item.durationSeconds || parseTimeToSeconds('02:00') || 120;
    const timing = createQueueTiming(duration);
    const buildings = city.buildings.map((b) =>
      (b.id === item.buildingId || b.name === item.name) ? { ...b, upgrading: true } : b,
    );
    patchCity(set, get, cityId, {
      buildings,
      constructionQueue: city.constructionQueue.map((q) =>
        q.id === queueId ? { ...q, queued: false, ...timing } : q,
      ),
    });
    useNotificationStore.getState().addToast(`${item.name} inşaatı başlatıldı`, 'success');
    return true;
  },

  startQueuedProduction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    if (city.productionQueue.some((q) => !q.queued)) return false;
    const item = city.productionQueue.find((q) => q.id === queueId && q.queued);
    if (!item) return false;
    const duration = (item.durationSeconds || 30) * (item.count || 1);
    const timing = createQueueTiming(duration);
    patchCity(set, get, cityId, {
      productionQueue: city.productionQueue.map((q) =>
        q.id === queueId ? { ...q, queued: false, ...timing } : q,
      ),
    });
    useNotificationStore.getState().addToast(`${item.count} ${item.unit} üretimi başlatıldı`, 'success');
    return true;
  },

  cancelConstruction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    const item = city.constructionQueue.find((q) => q.id === queueId);
    if (!item) return;

    const refundFactor = item.queued ? 1 : 0.5;

    let resources = city.resources;
    if (item.costPaid) {
      const refunded = refundCostWithDepotCap(resources, item.costPaid, item.costQty ?? 1, refundFactor);
      resources = refunded.resources;
      if (refunded.overflow?.length) {
        useNotificationStore.getState().addToast(
          `Depo dolu — iade kaynağının bir kısmı silindi`,
          'warn',
        );
      }
    }

    const wasActive = !item.queued;
    const buildings = city.buildings.map((b) => {
      if (!wasActive || (b.id !== item.buildingId && b.name !== item.name)) return b;
      return { ...b, upgrading: false };
    });

    patchCity(set, get, cityId, {
      resources,
      buildings,
      constructionQueue: city.constructionQueue.filter((q) => q.id !== queueId),
    });
    useNotificationStore.getState().addToast(
      item.queued ? 'İnşaat kuyruktan çıkarıldı' : 'İnşaat iptal edildi — kaynakların %50\'si iade edildi',
      'info',
    );
  },

  cancelProduction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    const item = city.productionQueue.find((q) => q.id === queueId);
    if (!item) return;

    let resources = city.resources;
    if (item.costPaid) {
      const refunded = refundCostWithDepotCap(resources, item.costPaid, item.costQty ?? 1);
      resources = refunded.resources;
      if (refunded.overflow?.length) {
        useNotificationStore.getState().addToast(
          `Depo dolu — iade kaynağının bir kısmı silindi`,
          'warn',
        );
      }
    }

    const popRefund = item.popCost ?? getUnitPopulationCost(item.unitId, item.count ?? 1);
    const withPop = restorePopulation({ ...city, resources }, popRefund);

    patchCity(set, get, cityId, {
      resources: withPop.resources,
      idlePopulation: withPop.idlePopulation,
      productionQueue: city.productionQueue.filter((q) => q.id !== queueId),
    });
    useNotificationStore.getState().addToast('Üretim iptal edildi', 'info');
  },

  enqueueResearch: (researchId, { addToQueue = false } = {}) => {
    const state = get();
    const list = state.researches ?? [];
    const research = list.find((r) => r.id === researchId);
    if (!research || research.active || research.queued || research.cost === '—') return false;
    const activeCity = getActiveCity(state);
    if (research.category === 'kbrn' && !isKbrnBranchUnlocked(activeCity)) {
      useNotificationStore.getState().addToast(
        'KBRN araştırmaları için Ar-Ge Merkezi Sv.8 gerekli',
        'warn',
      );
      return false;
    }
    const costStr = research.category === 'kbrn'
      ? scaleKbrnResearchCost(research.cost, research.level ?? 0)
      : research.cost;
    if (!addToQueue && list.some((r) => r.active)) return false;
    if (!canAffordCost(costStr, 1, activeCity.resources)) return false;

    const hasActive = list.some((r) => r.active);
    const queued = addToQueue || hasActive;
    const duration = parseTimeToSeconds(research.time) || 300;
    const timing = queued
      ? { durationSeconds: duration, startedAt: null, endsAt: null }
      : createQueueTiming(duration);

    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const resources = deductCost(costStr, 1, city.resources);
    patchCity(set, get, cityId, { resources });

    set({
      researches: list.map((r) =>
        r.id === researchId
          ? {
            ...r,
            active: !queued,
            queued,
            ...timing,
            queueId: genId('rq'),
            lastPaidCost: costStr,
          }
          : r,
      ),
    });

    useNotificationStore.getState().addToast(
      queued ? `${research.name} kuyruğa eklendi` : `${research.name} araştırması başladı`,
      'success',
    );
    cloudSync(get, { cityId, researches: true });
    return true;
  },

  startQueuedResearch: (researchId) => {
    const state = get();
    const list = state.researches ?? [];
    if (list.some((r) => r.active)) return false;
    const research = list.find((r) => r.id === researchId && r.queued);
    if (!research) return false;
    const duration = research.durationSeconds || parseTimeToSeconds(research.time) || 300;
    const timing = createQueueTiming(duration);
    set({
      researches: list.map((r) =>
        r.id === researchId ? { ...r, active: true, queued: false, ...timing } : r,
      ),
    });
    return true;
  },

  cancelResearch: (researchId) => {
    const state = get();
    const list = state.researches ?? [];
    const research = list.find((r) => r.id === researchId);
    if (!research || (!research.active && !research.queued)) return;

    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const refundCost = research.category === 'kbrn'
      ? (research.lastPaidCost ?? scaleKbrnResearchCost(research.cost, Math.max(0, (research.level ?? 1) - 1)))
      : research.cost;
    const { resources, overflow } = refundCostWithDepotCap(city.resources, refundCost, 1);
    patchCity(set, get, cityId, { resources });
    if (overflow?.length) {
      useNotificationStore.getState().addToast('Depo dolu — iade kaynağının bir kısmı silindi', 'warn');
    }

    set({
      researches: list.map((r) =>
        r.id === researchId
          ? { ...r, active: false, queued: false, startedAt: null, endsAt: null, durationSeconds: null }
          : r,
      ),
    });
    useNotificationStore.getState().addToast('Araştırma iptal edildi', 'info');
  },

  /** Sekme / pencere odağına dönünce sayaçları gerçek zamana senkronize et. */
  syncTimersOnWake: () => {
    const now = Date.now();
    const state = get();
    const last = state.lastTickAt ?? now;
    const elapsedSec = Math.min(Math.floor((now - last) / 1000), 60 * 60 * 8);

    if (elapsedSec > 1) {
      const vipMult = getVipMultiplierFromState(state);
      const cities = refreshAllCitiesMorale({
        ...state,
        cities: Object.fromEntries(
          Object.entries(state.cities).map(([cityId, city]) => {
            let resources = city.resources.map((r) => {
              if (r.productionFrozen || (r.max != null && r.current > r.max)) return r;
              const inc = ratePerSecond(r.rate) * elapsedSec;
              if (!inc) return r;
              let next = r.current + inc;
              if (r.max != null) next = Math.min(r.max, next);
              return { ...r, current: Math.floor(next) };
            });
            return { ...city, resources };
          }),
        ),
      });
      set({ cities, now, lastTickAt: now });
    } else {
      set({ now, lastTickAt: now });
    }

    get().touchPlayerActivity();
    get()._runServerCleansing(false, 'wake');
    get().tick();
    cloudSync(get, { saveAllUnits: true });

    if (isSyncEnabled() && get()._supabaseHydrated) {
      syncExpeditionsFromServer(
        get,
        (patch) => set(patch),
        (id) => get()._completeExpedition(id),
      ).catch((err) => console.warn('[gameStore] expedition sync', err));
    }
  },

  startTicker: () => {
    if (globalTickerId != null) {
      return () => {
        clearInterval(globalTickerId);
        globalTickerId = null;
      };
    }
    globalTickerId = setInterval(() => get().tick(), 1000);
    return () => {
      clearInterval(globalTickerId);
      globalTickerId = null;
    };
  },
}));

export function useActiveCity() {
  return useGameStore((s) => s.cities[s.activeCityId]);
}

export function useActiveCityResources() {
  return useGameStore(
    (s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY,
  );
}

export function useActiveCityIdleTroops() {
  return useGameStore(
    (s) => s.cities[s.activeCityId]?.idleTroops ?? STORE_EMPTY_ARRAY,
  );
}

export function useExpeditionSummary() {
  return useGameStore(
    useShallow((s) => ({
      incoming: s.expeditions.filter((e) => e.direction === 'returning').length,
      outgoing: s.expeditions.filter((e) => e.direction === 'outgoing').length,
    })),
  );
}

export function useUnderAttack() {
  return useGameStore((s) =>
    s.incomingAttacks.some((a) => a.targetCityId === s.activeCityId),
  );
}

export function useReportsNavBadge() {
  return useGameStore(
    (s) => s.navBadges.reports || s.reports.some((r) => r.isNew),
  );
}

export function getExpeditionOriginLabel(exp, playerCities) {
  if (exp.originCityName) return exp.originCityName;
  const city = playerCities.find((c) => c.id === exp.originCityId);
  return city?.name ?? '—';
}

export function useActiveExpeditionCount() {
  return useGameStore((s) => s.expeditions.length);
}

export function useConstructionQueueFull() {
  return useGameStore(
    (s) => (s.cities[s.activeCityId]?.constructionQueue?.length ?? 0) >= CONSTRUCTION_QUEUE_LIMIT,
  );
}

export function useTroopsAwayMap(cityId) {
  return useGameStore(
    useShallow((s) => getTroopsAwayFromCity(s.expeditions, cityId ?? s.activeCityId)),
  );
}

export function formatCityOptionLabel(city) {
  if (city.province) return `${city.name} (${city.province})`;
  if (city.provinceName) return `${city.name} (${city.provinceName})`;
  return city.name;
}

export { buildLossRows, CONSTRUCTION_QUEUE_LIMIT };

export function formatQueueRemaining(endsAt, now) {
  return formatSeconds(remainingFromEndsAt(endsAt, now));
}
