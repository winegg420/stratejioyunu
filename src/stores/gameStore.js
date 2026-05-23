import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createFoundCityState, createInitialGameState } from '../data/gameInit';
import { ensureCityResources, getResourceDisplay } from '../data/resourceCatalog';
import { buildMarketTradeCost } from '../lib/marketExchange';
import { tickOpenMarket } from '../lib/openMarket';
import {
  acceptTreatyProposal,
  createTreatyProposal,
  isAttackBlockedByTreaties,
  TREATY_KIND,
  tickTreatyExpiry,
  TREATY_STATUS,
} from '../lib/diplomaticAgreements';
import { tickWarPopulationMigration } from '../lib/populationMigration';
import {
  BLACK_MARKET_TYPES,
  buildExposureCrisisNews,
  createBlackMarketListing,
  rollBlackMarketExposure,
} from '../lib/blackMarket';
import {
  ALLIANCE_OP_STATUS,
  approveAllianceParticipant,
  buildOperationNewsText,
  computeCoordinatedLaunchAt,
  createAllianceOperation as buildAllianceOperation,
} from '../lib/allianceOperation';
import { BUILDING_LABELS } from '../lib/buildingUtils';
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
import { ALLIANCE, diplomacy, landUnits } from '../data/placeholder';
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
  calcTradeDepotOverflow,
  canAffordTrade,
  deductTradeResources,
  formatTradeCargoSummary,
  sumTradeAmounts,
} from '../lib/tradeUtils';
import {
  ADMIN_ACTION,
  buildCentralBankLogText,
  buildCrisisAdminLogText,
  buildRegionalIncentiveLogText,
  createAdminNewsEntry,
  DEFAULT_CENTRAL_BANK,
  mergeAdminLogsIntoNews,
  normalizeCentralBank,
  normalizeRegionalIncentive,
  resolveCityRegionId,
  scaleTradeWithCentralBank,
} from '../lib/adminOverrideEngine';
import {
  fetchAdminLogs,
  fetchServerBroadcast,
  insertAdminLog,
  saveServerBroadcast,
} from '../lib/adminBroadcastSync';
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
  resolveFoundCityCost,
  resolveFoundCityName,
} from '../lib/foundCityConfig';
import {
  evaluateConquestAttempt,
  getColonyCount,
  getEmpireBudgetIncomeMultiplier,
  getEmpireHappinessPenalty,
  getNearestEmpireOrigin,
} from '../lib/empireExpansion';
import {
  buildColonyPlayerCityFromMap,
  findPlayerCityByMapName,
  getMainHqCity,
  isRaidOnlyMapTarget,
  isConquerableMapTarget,
  seedWorldMapFromProvinces,
} from '../lib/worldCitySystem';
import { slugCityId } from '../lib/cityIdUtils';
import {
  buildCargoTransitPayload,
  calcAirLogisticsCost,
  calcCargoTransferDuration,
  canUseAirLogistics,
  CARGO_RESOURCE_ID,
  formatCargoAmount,
  formatCargoLogisticsLabel,
  getCargoAmountFromPayload,
  LOGISTICS_MODE,
} from '../lib/cargoLogistics';
import {
  canAffordEmpireMoney,
  creditEmpireMoney,
  deductEmpireMoney,
} from '../lib/empireTreasury';
import { PANEL_LOCKED_BUILDING_IDS } from '../lib/buildingUtils';
import { areTutorialPrerequisitesMet } from '../lib/milAiTutorialQuests';
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
import { canAffordCost, deductCost, parseUnitCost } from '../utils/resourceCosts';
import { useNotificationStore } from './notificationStore';
import { clampTaxRate, enrichCityModel } from '../lib/cityModel';
import { syncResearchesToCatalog } from '../data/researchCatalog';
import { syncAllCityBuildings } from '../lib/buildingUtils';
import {
  loadMilAiCompleted,
  loadProtectionEndsAt,
  saveMilAiCompleted,
  savePlayerIdeology,
  saveProtectionEndsAt,
} from '../lib/briefingStorage';
import {
  evaluatePeaceForceForExpedition,
  getProgressionState,
  isPeaceForceProtected,
} from '../lib/progressionSystem';
import {
  applyDevTestModeToState,
  bypassWarLocksForDevTest,
  getDevTestCyberCapabilities,
  isDevTestMode,
} from '../lib/devTestMode';
import {
  disableAdminModeOnState,
  enableAdminModeOnState,
} from '../lib/adminModeControl';
import { translate, LANG_STORAGE_KEY } from '../i18n';
import {
  getNextAutoTutorialQuest,
  isQuestComplete,
  MIL_AI_TUTORIAL_QUESTS,
  normalizeMilAiCompleted,
} from '../lib/milAiTutorialQuests';
import {
  applyAiCenterEnergyDrain,
  applyAiResourceAutoBalanceTick,
  applyConstructionDurationSeconds,
  applyExpeditionTravelSeconds,
  applyMilitaryProductionDurationSeconds,
  getAiCombatTacticalMult,
} from '../lib/aiCenterEngine';
import {
  saveCosmeticTitles,
  saveDailyQuestsState,
  saveSeasonEngagement,
  saveSeasonStats,
  saveWatchlist,
} from '../lib/engagementStorage';
import {
  applyQuestResourceReward,
  buildDailyQuestContext,
  claimDailyQuest,
  evaluateDailyQuests,
  markSocialistAidFlag,
  markTradeVolume,
  syncDailyQuestsState,
} from '../lib/dailyQuests';
import {
  buildSeasonLeaderboard,
  claimSeasonReward,
  getPlayerSeasonRank,
  getPlayerSeasonScore,
  recordSeasonStat,
  rolloverSeasonStats,
  SEASON_PERIOD,
  syncSeasonEngagement,
} from '../lib/seasonChampionship';
import {
  buildIntelFeedEntry,
  canAddToWatchlist,
  createWatchlistEntry,
  pruneIntelFeed,
  WATCHLIST_AGENT_COST,
} from '../lib/watchlistSystem';
import {
  appendChronicle,
  buildBetrayalChronicle,
  buildRegimeChronicle,
  buildWarChronicleFromCombat,
  createChronicleEntry,
  CHRONICLE_TYPES,
  createDefaultChronicleState,
  findRecentTreatyBreak,
  formatWarChronicle,
  isMajorBattle,
  normalizeDiplomaticTreaties,
  syncSeasonChronicles,
} from '../lib/historyBook';
import {
  loadDiplomaticTreaties,
  loadSeasonChronicles,
  loadTreatyBreaks,
  saveDiplomaticTreaties,
  saveSeasonChronicles,
  saveTreatyBreaks,
} from '../lib/historyBookStorage';
import { persistChronicleToServer } from '../lib/historyBookApi';
import {
  applyIdeologyTravelSeconds,
  canChangeIdeology,
  defaultProtectionEndsAt,
  formatIdeologyLabel,
  getProductionDurationMultiplier,
  getResearchDurationMultiplier,
  getTradeRevenueMultiplier,
  isValidIdeology,
} from '../lib/ideologySystem';
import {
  applyLoyaltyDelta,
  buildRegimeChangeNewsText,
  CAPITALIST_BUDGET_SURGE_THRESHOLD,
  getActiveCityMoney,
  getLoyaltyPoints,
  IDEOLOGY_CHANGE_COST_MONEY,
  IDEOLOGY_CHANGE_REAL_MONEY_NOTE,
  isSocialistAidPayload,
  LOYALTY_ACTION,
  REGIME_CHANGE_HAPPINESS_DROP,
  sumPlayerMoney,
} from '../lib/loyaltySystem';
import {
  CRISIS_LOYALTY_RESPONSE,
  CRISIS_SEVERITY,
  CRISIS_TYPE,
  formatCrisisLabel,
  isCorrectCrisisResponse,
  pruneCrisisEffects,
  shouldTriggerPlayerEconomicCrisis,
  tickCrisisWorldEvents,
  triggerCrisis,
} from '../lib/crisisEngine';
import {
  buildCyberOpsLogEntry,
  canLaunchCyberAbility,
  CYBER_ABILITIES,
  getCyberAbilityById,
  getUnlockedCyberCapabilities,
} from '../lib/cyberOps';
import {
  canLaunchStealthCbrnOp,
  getWeaponDevelopmentLevel,
  isKbrnBranchUnlocked,
  scaleAdvancedResearchCost,
} from '../lib/kbrnResearch';
import { ADVANCED_RESEARCH_CATEGORY } from '../data/researchCatalog';
import {
  buildKbrnDefenderAlertReport,
  calcKbrnChemTravelSeconds,
  getCbrnChemOpCost,
  resolveKbrnChemMission,
  tickCbrnWorldEvents,
  triggerRandomCbrnEvent as rollGlobalCbrnOutbreak,
  formatNewsTickerTime,
} from '../utils/cbrnEngine';
import { isGameAdmin } from '../lib/adminAccess';

function canUseAdminOverride(state, playerKey) {
  return isGameAdmin({
    playerName: playerKey,
    profileIsAdmin: state.isAdminUser,
  });
}
import {
  applyConstructionTimeReduction,
  calcConstructionSpeedupDiamondCost,
  getPlayerDiamonds,
} from '../lib/premiumDiamonds';
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
  getLastSyncUserId,
  hydrateGameStore,
  isSyncEnabled,
  saveGameStateNow,
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

/** Bina (11) ve araştırma (12) kataloglarını bellek state ile hizalar */
function renormalizeCatalogState(state) {
  return {
    cities: syncAllCityBuildings(state.cities ?? {}),
    researches: syncResearchesToCatalog(state.researches ?? []),
  };
}

function patchCity(set, get, cityId, patch) {
  const { cities } = get();
  const existing = cities[cityId];
  if (!existing) return;
  const cityPatch = patch.resources
    ? { ...patch, resources: ensureCityResources(patch.resources) }
    : patch;
  set({
    cities: {
      ...cities,
      [cityId]: enrichCityModel({ ...existing, ...cityPatch }),
    },
  });
}

const BUDGET_SPEND_FLOAT_MS = 1500;

function moneyInCost(costStr, qty) {
  const lines = parseUnitCost(costStr);
  const moneyLine = lines.find((c) => c.resourceId === 'money');
  return moneyLine ? Math.floor(moneyLine.amount * qty) : 0;
}

/** Global bütçe barı — kırmızı -X yüzen animasyonu */
function pushBudgetSpendFloat(set, get, amount) {
  const n = Math.floor(amount);
  if (n <= 0) return;
  const id = genId('bsp');
  set({
    budgetSpendFloats: [...(get().budgetSpendFloats ?? []).slice(-4), { id, amount: n }],
  });
  window.setTimeout(() => {
    set((s) => ({
      budgetSpendFloats: (s.budgetSpendFloats ?? []).filter((f) => f.id !== id),
    }));
  }, BUDGET_SPEND_FLOAT_MS);
}

function persistEngagement(get) {
  const key = getCurrentPlayerName();
  const s = get();
  saveSeasonStats(key, s.seasonStats);
  saveSeasonEngagement(key, s.seasonEngagement);
  saveDailyQuestsState(key, s.dailyQuests);
  saveWatchlist(key, s.watchlist);
  saveCosmeticTitles(key, s.cosmeticTitles);
  saveSeasonChronicles(key, s.seasonChronicles);
  saveDiplomaticTreaties(key, s.diplomaticTreaties);
  saveTreatyBreaks(key, s.treatyBreaks);
}

function persistChronicleState(get) {
  const key = getCurrentPlayerName();
  saveSeasonChronicles(key, get().seasonChronicles);
}

function refreshEngagementDerived(state) {
  const now = Date.now();
  const seasonStats = rolloverSeasonStats(state.seasonStats, now);
  const seasonEngagement = syncSeasonEngagement(state.seasonEngagement, now);
  let dailyQuests = syncDailyQuestsState(state.dailyQuests, state.playerIdeology, now);
  dailyQuests = evaluateDailyQuests(
    dailyQuests,
    buildDailyQuestContext({ ...state, seasonStats }),
  );
  const intelFeed = pruneIntelFeed(state.intelFeed);
  const seasonChronicles = syncSeasonChronicles(
    state.seasonChronicles ?? createDefaultChronicleState(now),
    now,
  );
  return { seasonStats, seasonEngagement, dailyQuests, intelFeed, seasonChronicles };
}

function applyPeaceForceGate(get, targetCity, mode) {
  if (bypassWarLocksForDevTest()) return true;
  const state = get();
  const gate = evaluatePeaceForceForExpedition(state, targetCity, mode);
  if (!gate.ok) {
    useNotificationStore.getState().addToast(
      gate.reason ?? 'Barış Gücü koruması bu operasyonu engelliyor.',
      'warn',
    );
    return false;
  }
  if (gate.revokePeaceForce) {
    get().revokePeaceForceProtection();
  }
  return true;
}

function getCityAdminContext(state, cityId) {
  const pc = state.playerCities?.find((c) => c.id === cityId);
  return {
    _regionalIncentive: normalizeRegionalIncentive(state.regionalIncentive),
    _cityRegionId: resolveCityRegionId(pc, state.mapCities),
    _centralBank: normalizeCentralBank(state.centralBank ?? DEFAULT_CENTRAL_BANK),
  };
}

function refreshCityMorale(state, cityId) {
  const city = state.cities[cityId];
  if (!city) return city;

  const adminCtx = getCityAdminContext(state, cityId);
  const cyberEffects = pruneCyberEffects(city.cyberEffects);
  const kbrnEffects = pruneKbrnEffects(city.kbrnEffects);
  const crisisEffects = pruneCrisisEffects(city.crisisEffects);
  const colonyCount = getColonyCount(state);
  const empireHappinessPenalty = getEmpireHappinessPenalty(colonyCount);
  const empireBudgetMult = getEmpireBudgetIncomeMultiplier(colonyCount);
  const happiness = computeCityHappiness(
    { ...city, cyberEffects, kbrnEffects, crisisEffects },
    {
      cityId,
      incomingAttacks: state.incomingAttacks,
      expeditions: state.expeditions,
      activeCrisis: state.activeCrisis,
      empireHappinessPenalty,
    },
  );
  const popDrain = getKbrnPopulationDrain(kbrnEffects);
  const basePopulation = city.basePopulation ?? city.population ?? 0;
  const population = Math.max(400, basePopulation - popDrain);
  const vipMult = getVipMultiplierFromState(state);
  const resources = applyProductionFreeze(
    ensureCityResources(city.resources),
    city.buildings ?? [],
    {
      ...city,
      cityId,
      cyberEffects,
      kbrnEffects,
      happiness,
      population,
      _incomingAttacks: state.incomingAttacks,
      _expeditions: state.expeditions,
      _playerIdeology: state.playerIdeology,
      _activeCrisis: state.activeCrisis,
      _peaceForceShield: isPeaceForceProtected(state.protectionEndsAt),
      _empireBudgetMult: empireBudgetMult,
      crisisEffects,
      ...adminCtx,
    },
    vipMult,
    state.playerIdeology,
  );

  return enrichCityModel({
    ...city,
    cyberEffects,
    kbrnEffects,
    crisisEffects,
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
        { icon: '👥', label: 'Nüfus', amount: 1200 + Math.floor(Math.random() * 800) },
        { icon: '🧱', label: 'Hammadde', amount: 900 + Math.floor(Math.random() * 500) },
        { icon: '💰', label: 'Bütçe', amount: 400 + Math.floor(Math.random() * 300) },
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
  const refineryLevel = 5 + Math.floor(Math.random() * 4);
  const infantry = 800 + Math.floor(Math.random() * 1600);
  const tank = 20 + Math.floor(Math.random() * 80);
  const armor = 50 + Math.floor(Math.random() * 150);
  const foodStock = 4000 + Math.floor(Math.random() * 8000);
  const metalStock = 2000 + Math.floor(Math.random() * 5000);

  if (!success) {
    return [
      { key: 'refinery', label: 'Rafineri Seviyesi', hidden: true },
      { key: 'food', label: 'Nüfus Rezervi', hidden: true },
      { key: 'hammadde', label: 'Hammadde Deposu', hidden: true },
      { key: 'infantry', label: 'Piyade', hidden: true },
      { key: 'tank', label: 'Tank', hidden: true },
      { key: 'armor', label: 'Zırhlı', hidden: true },
    ];
  }

  const maybeHide = () => Math.random() > 0.55;
  return [
    { key: 'refinery', label: 'Rafineri Seviyesi', value: `Sv.${refineryLevel}`, hidden: maybeHide() },
    { key: 'food', label: 'Nüfus Rezervi', value: foodStock.toLocaleString('tr-TR'), hidden: maybeHide() },
    { key: 'hammadde', label: 'Hammadde Deposu', value: metalStock.toLocaleString('tr-TR'), hidden: maybeHide() },
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

function generateCargoReport(expedition, delivered, overflow = []) {
  const qty = getCargoAmountFromPayload(expedition.tradePayload);
  const modeLabel = formatCargoLogisticsLabel(expedition.logisticsMode ?? LOGISTICS_MODE.ROAD);
  return {
    id: genId('r'),
    filterType: 'logistics',
    type: 'Hammadde Lojistiği',
    title: `${expedition.originCityName} → ${expedition.target}`,
    date: nowReportDate(),
    preview: delivered
      ? `[LOJİSTİK RAPORU] ${expedition.originCityName} → ${qty.toLocaleString('tr-TR')} hammadde teslim edildi`
      : 'Sevkiyat iptal edildi.',
    cargo: formatCargoAmount(qty),
    logisticsMode: expedition.logisticsMode,
    logisticsLabel: modeLabel,
    airCost: expedition.airCostPaid ?? 0,
    durationSeconds: expedition.durationSeconds,
    distance: expedition.distance,
    overflow,
    originCityId: expedition.originCityId,
    targetCityId: expedition.targetCityId,
    targetCity: expedition.target,
    isNew: true,
  };
}

function appendNewsLog(state, text) {
  const item = {
    id: genId('news'),
    text,
    at: Date.now(),
  };
  return [item, ...(state.newsLog ?? [])].slice(0, 48);
}

function generateAgentReport(op, success, agentsLost) {
  const intelFields = buildSpyIntelFields(success);
  const agentCaptured = agentsLost > 0;
  return {
    id: genId('r'),
    reportCategory: 'operation',
    filterType: 'spy',
    type: 'Ajan Operasyonu',
    title: `${op.target} — ${op.opType}`,
    date: nowReportDate(),
    preview: success
      ? 'Operasyon başarılı — istihbarat raporu arşivlendi.'
      : agentCaptured
        ? `${agentsLost} ajan yakalandı — operasyon başarısız.`
        : 'Operasyon başarısız — ajanlar geri çekildi.',
    targetCity: op.target,
    intelSuccess: success,
    operationSuccess: success,
    agentCaptured,
    agentsLost,
    operationOpId: op.opId ?? null,
    intelFields,
    findings: success
      ? 'Hedef verileri sızdırıldı.'
      : agentCaptured
        ? 'Düşman karşı istihbarat ağı ajanları tespit etti.'
        : 'Operasyon başarısız — veri alınamadı',
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

  executeMarketTrade: ({ resourceId, qty, mode }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city) return false;
    const market = city.buildings?.find((b) => b.id === 'market');
    if (!market || market.level < 1) {
      useNotificationStore.getState().addToast(
        `Pazar işlemleri için önce ${BUILDING_LABELS.market} inşa edilmeli.`,
        'warn',
      );
      return false;
    }
    const amount = Math.max(0, Math.floor(Number(qty) || 0));
    if (!amount) return false;

    const trade = buildMarketTradeCost(resourceId, amount, mode, state.centralBank);
    if (!trade) return false;

    const moneyPay = trade.pay.money ?? 0;
    const moneyRecv = trade.receive.money ?? 0;
    if (moneyPay > 0 && !canAffordEmpireMoney(state.cities, moneyPay)) {
      useNotificationStore.getState().addToast('Ortak bütçede yeterli nakit yok.', 'warn');
      return false;
    }

    let cities = { ...state.cities };
    let resources = (cities[cityId]?.resources ?? city.resources).map((r) => ({ ...r }));

    for (const [id, pay] of Object.entries(trade.pay)) {
      if (id === 'money') continue;
      const res = resources.find((r) => r.id === id);
      if (!res || res.current < pay) {
        useNotificationStore.getState().addToast('Yetersiz kaynak — işlem iptal.', 'warn');
        return false;
      }
    }

    if (moneyPay > 0) {
      const treasury = deductEmpireMoney(cities, moneyPay, cityId);
      cities = treasury.cities;
      resources = (cities[cityId]?.resources ?? resources).map((r) => ({ ...r }));
      pushBudgetSpendFloat(set, get, moneyPay);
    }

    resources = resources.map((r) => {
      const pay = trade.pay[r.id];
      if (pay && r.id !== 'money') return { ...r, current: Math.max(0, Math.floor(r.current - pay)) };
      const recv = trade.receive[r.id];
      if (recv && r.id !== 'money') {
        const next = r.current + recv;
        return { ...r, current: r.max != null ? Math.min(r.max, next) : next };
      }
      return r;
    });

    if (moneyRecv > 0) {
      cities = {
        ...cities,
        [cityId]: { ...cities[cityId], resources: ensureCityResources(resources) },
      };
      const credited = creditEmpireMoney(cities, moneyRecv, cityId);
      cities = credited.cities;
      resources = (cities[cityId]?.resources ?? resources).map((r) => ({ ...r }));
    } else {
      cities = {
        ...cities,
        [cityId]: { ...cities[cityId], resources: ensureCityResources(resources) },
      };
    }

    set({ cities });
    const { label } = getResourceDisplay(resourceId);
    const verb = mode === 'buy' ? 'Alındı' : 'Satıldı';
    useNotificationStore.getState().addToast(`${verb}: ${label} ×${amount}`, 'success');
    cloudSync(get, { cityId });
    return true;
  },

  postMarketOffer: ({ resourceId, qty, unitPrice, side = 'sell' }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city) return false;
    const amount = Math.max(0, Math.floor(Number(qty) || 0));
    const price = Math.max(0, Math.floor(Number(unitPrice) || 0));
    if (!amount || !price) return false;

    let resources = city.resources.map((r) => ({ ...r }));
    if (side === 'sell') {
      const res = resources.find((r) => r.id === resourceId);
      if (!res || res.current < amount) {
        useNotificationStore.getState().addToast('İlan için yeterli stok yok', 'warn');
        return false;
      }
      resources = resources.map((r) => (
        r.id === resourceId
          ? { ...r, current: Math.max(0, r.current - amount) }
          : r
      ));
      patchCity(set, get, cityId, { resources: ensureCityResources(resources) });
    }

    const offer = {
      id: genId('mkt'),
      resourceId,
      qty: amount,
      unitPrice: price,
      side,
      status: 'open',
      author: getCurrentPlayerName(),
      sellerCityId: cityId,
      at: Date.now(),
    };
    set({
      marketOffers: [offer, ...(get().marketOffers ?? [])].slice(0, 48),
      ...tickOpenMarket(get()),
    });
    useNotificationStore.getState().addToast('[ TEKLİF ] Açık pazar ilanı yayınlandı.', 'success');
    return true;
  },

  acceptMarketOffer: (offerId) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const offer = (state.marketOffers ?? []).find((o) => o.id === offerId && o.status === 'open');
    if (!offer || !city) return false;
    if (offer.author === getCurrentPlayerName()) {
      useNotificationStore.getState().addToast('Kendi ilanınızı satın alamazsınız', 'warn');
      return false;
    }

    const totalCost = offer.unitPrice * offer.qty;
    if (!canAffordEmpireMoney(state.cities, totalCost)) {
      useNotificationStore.getState().addToast('Yetersiz bütçe', 'warn');
      return false;
    }

    let cities = state.cities;
    const paid = deductEmpireMoney(cities, totalCost, cityId);
    cities = paid.cities;
    pushBudgetSpendFloat(set, get, totalCost);

    let resources = (cities[cityId]?.resources ?? city.resources).map((r) => ({ ...r }));
    const row = resources.find((r) => r.id === offer.resourceId);
    if (row) {
      const next = row.current + offer.qty;
      resources = resources.map((r) => (
        r.id === offer.resourceId
          ? { ...r, current: r.max != null ? Math.min(r.max, next) : next }
          : r
      ));
    }

    cities = {
      ...cities,
      [cityId]: {
        ...cities[cityId],
        resources: ensureCityResources(resources),
      },
    };

    if (offer.sellerCityId && cities[offer.sellerCityId]) {
      const credited = creditEmpireMoney(cities, totalCost, offer.sellerCityId);
      cities = credited.cities;
    }

    const marketOffers = (state.marketOffers ?? []).filter((o) => o.id !== offerId);
    const { label } = getResourceDisplay(offer.resourceId);
    set({
      cities,
      marketOffers,
      ...tickOpenMarket({ ...state, cities, marketOffers }),
    });
    useNotificationStore.getState().addToast(
      `İlan alındı: ${label} ×${offer.qty}`,
      'success',
    );
    return true;
  },

  cancelMarketOffer: (offerId) => {
    const state = get();
    const offer = (state.marketOffers ?? []).find((o) => o.id === offerId);
    if (!offer || offer.author !== getCurrentPlayerName()) return false;

    if (offer.side === 'sell' && offer.sellerCityId) {
      const city = state.cities[offer.sellerCityId];
      if (city) {
        const resources = city.resources.map((r) => {
          if (r.id !== offer.resourceId) return r;
          const next = r.current + offer.qty;
          return { ...r, current: r.max != null ? Math.min(r.max, next) : next };
        });
        patchCity(set, get, offer.sellerCityId, { resources: ensureCityResources(resources) });
      }
    }

    set({
      marketOffers: (state.marketOffers ?? []).filter((o) => o.id !== offerId),
      ...tickOpenMarket(get()),
    });
    useNotificationStore.getState().addToast('[ İLAN İPTAL ] Kaynaklar iade edildi — ceza yok.', 'info');
    return true;
  },

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

  ensureMapBotProvinces: (provinces) => {
    if (!provinces?.features?.length) return false;
    const state = get();
    const playerName = getCurrentPlayerName();
    const seeded = seedWorldMapFromProvinces({
      mapCities: state.mapCities,
      playerCities: state.playerCities,
      provinces,
      gameConfig: state.gameConfig,
    });
    const mapCities = syncMapCitiesForPlayer(
      seeded,
      state.playerCities,
      playerName,
      state.playerIdeology,
    );
    const botsChanged = seeded !== state.mapCities;
    const ideologyChanged = mapCities.some((c, i) => {
      const prev = state.mapCities[i];
      return !prev || prev.name !== c.name || prev.ownerIdeology !== c.ownerIdeology;
    });
    if (!botsChanged && !ideologyChanged) return false;
    syncRegistryFromMap(mapCities);
    set({ mapCities, mapRouteSyncRev: (state.mapRouteSyncRev ?? 0) + 1 });
    return true;
  },

  applyAdminTestBoost: () => {
    if (!isDevTestMode()) return false;
    set((state) => applyDevTestModeToState(state));
    return true;
  },

  enableAdminMode: async () => {
    set((state) => enableAdminModeOnState(state));
    get().applyAdminTestBoost();
    return true;
  },

  disableAdminMode: async () => {
    set((state) => disableAdminModeOnState(state));
    const userId = getLastSyncUserId();
    if (userId && get()._supabaseHydrated) {
      await saveGameStateNow(get(), {
        profileId: userId,
        saveAllUnits: true,
        researches: true,
      });
    }
    return true;
  },

  initWorldSystems: () => {
    const state = get();
    const catalogPatch = renormalizeCatalogState(state);
    const playerName = getCurrentPlayerName();
    const mapCities = syncMapCitiesForPlayer(
      state.mapCities,
      state.playerCities,
      playerName,
      state.playerIdeology,
    );
    syncRegistryFromMap(mapCities);
    set({ ...catalogPatch, mapCities });
    get().applyAdminTestBoost();
    get()._runServerCleansing(false);
    get().touchPlayerActivity();
    get().refreshServerBroadcast();
  },

  refreshServerBroadcast: async () => {
    const [broadcast, logs] = await Promise.all([
      fetchServerBroadcast(),
      fetchAdminLogs(80),
    ]);
    const regionalIncentive = normalizeRegionalIncentive(broadcast.regionalIncentive);
    const centralBank = normalizeCentralBank(broadcast.centralBank);
    const state = get();
    let cities = state.cities;
    if (regionalIncentive || centralBank) {
      cities = Object.fromEntries(
        Object.entries(state.cities).map(([id]) => [
          id,
          refreshCityMorale(
            { ...state, centralBank, regionalIncentive },
            id,
          ),
        ]),
      );
    }
    set({
      centralBank,
      regionalIncentive,
      adminPublicLogs: logs,
      cities,
      newsLog: mergeAdminLogsIntoNews(state.newsLog, logs),
    });
  },

  recordAdminOverride: async ({ actionType, logText, payload = {}, newsItem = null }) => {
    const actor = getCurrentPlayerName();
    const item = newsItem ?? createAdminNewsEntry(logText);
    await insertAdminLog({
      actorName: actor,
      actionType,
      logText,
      payload,
    });
    const logs = await fetchAdminLogs(80);
    set({
      newsLog: mergeAdminLogsIntoNews([item, ...(get().newsLog ?? [])], logs),
      adminPublicLogs: logs,
    });
    return item;
  },

  gameHydrating: false,

  hydrateFromSupabase: async (userId, playerName) => {
    set({ gameHydrating: true });
    try {
      const result = await hydrateGameStore(userId, {
        playerName,
        getState: get,
        setState: (patch) => set(patch),
        completeExpedition: (id) => get()._completeExpedition(id),
      });
      if (result?.ok) {
        set((prev) => renormalizeCatalogState(prev));
        get().applyAdminTestBoost();
        get().initWorldSystems();
        await get().refreshServerBroadcast();
      }
      return result ?? { ok: false };
    } finally {
      set({ gameHydrating: false });
    }
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

    const econTrigger = shouldTriggerPlayerEconomicCrisis(city, nextRate);
    if (econTrigger && !get().activeCrisis?.active) {
      get()._triggerPlayerEconomicCrisis(cityId, econTrigger.reason);
    }

    useNotificationStore.getState().addToast(
      `Vergi oranı %${nextRate} — moral ${nextCity.happiness}%`,
      nextRate > 20 ? 'warn' : 'info',
    );
    cloudSync(get, { cityId });
    return true;
  },

  _triggerPlayerEconomicCrisis: (cityId, reason) => {
    const state = get();
    const rolled = triggerCrisis(state, {
      type: CRISIS_TYPE.ECONOMIC,
      severity: CRISIS_SEVERITY.MODERATE,
      playerTriggered: true,
      targetCityId: cityId,
    });
    if (!rolled) return false;
    let cities = { ...state.cities, ...rolled.cityPatches };
    cities = Object.fromEntries(
      Object.entries(cities).map(([id, c]) => [
        id,
        refreshCityMorale({ ...state, cities, activeCrisis: rolled.activeCrisis }, id),
      ]),
    );
    set({
      activeCrisis: rolled.activeCrisis,
      cities,
      newsLog: [rolled.newsItem, ...(state.newsLog ?? [])].slice(0, 48),
      lastCrisisEventAt: rolled.lastCrisisEventAt,
    });
    useNotificationStore.getState().addToast(
      reason === 'extreme_tax'
        ? '[ EKONOMİK KRİZ ] Aşırı vergi politikası piyasayı çökertti!'
        : '[ EKONOMİK KRİZ ] İş gücü tükendi — üretim hatları durdu!',
      'danger',
    );
    cloudSync(get, { saveAllCities: true, savePlayerMeta: true, saveProfile: true });
    return true;
  },

  adminTriggerCrisis: async ({ type, catastrophic = false } = {}) => {
    const playerKey = getCurrentPlayerName();
    if (!canUseAdminOverride(get(), playerKey)) return false;
    const state = get();
    if (state.activeCrisis?.active) {
      useNotificationStore.getState().addToast('Aktif kriz var — önce sonlanmasını bekleyin veya süreyi bekleyin.', 'warn');
      return false;
    }
    const severity = catastrophic || type === CRISIS_TYPE.EARTHQUAKE
      ? CRISIS_SEVERITY.CATASTROPHIC
      : CRISIS_SEVERITY.MODERATE;
    const rolled = triggerCrisis(state, { type, severity, admin: catastrophic || type === CRISIS_TYPE.EARTHQUAKE });
    if (!rolled) return false;
    let cities = { ...state.cities, ...rolled.cityPatches };
    cities = Object.fromEntries(
      Object.entries(cities).map(([id, c]) => [
        id,
        refreshCityMorale({ ...state, cities, activeCrisis: rolled.activeCrisis }, id),
      ]),
    );
    const logText = buildCrisisAdminLogText({ type, catastrophic });
    await get().recordAdminOverride({
      actionType: ADMIN_ACTION.CRISIS,
      logText,
      payload: { type, catastrophic, severity },
      newsItem: rolled.newsItem,
    });
    set({
      activeCrisis: rolled.activeCrisis,
      cities,
      lastCrisisEventAt: rolled.lastCrisisEventAt,
    });
    useNotificationStore.getState().addToast(
      `[ KURUCU ] ${formatCrisisLabel(type)} tetiklendi`,
      'danger',
    );
    cloudSync(get, { saveAllCities: true, savePlayerMeta: true, saveProfile: true });
    return true;
  },

  adminSetCentralBank: async ({ fuelBasePrice, parities } = {}) => {
    const playerKey = getCurrentPlayerName();
    if (!canUseAdminOverride(get(), playerKey)) return false;
    const prev = normalizeCentralBank(get().centralBank);
    const centralBank = normalizeCentralBank({
      fuelBasePrice: fuelBasePrice ?? prev.fuelBasePrice,
      parities: { ...prev.parities, ...parities },
      updatedAt: Date.now(),
    });
    await saveServerBroadcast({
      centralBank,
      regionalIncentive: get().regionalIncentive,
    });
    const logText = buildCentralBankLogText(centralBank, prev);
    await get().recordAdminOverride({
      actionType: ADMIN_ACTION.CENTRAL_BANK,
      logText,
      payload: { centralBank },
    });
    let cities = Object.fromEntries(
      Object.entries(get().cities).map(([id]) => [
        id,
        refreshCityMorale({ ...get(), centralBank }, id),
      ]),
    );
    set({ centralBank, cities });
    useNotificationStore.getState().addToast('Merkez Bankası ayarları yayımlandı.', 'warn');
    return true;
  },

  adminSetRegionalIncentive: async ({
    regionId,
    resourceId = 'hammadde',
    multiplier = 2,
    durationHours = 168,
  } = {}) => {
    const playerKey = getCurrentPlayerName();
    if (!canUseAdminOverride(get(), playerKey)) return false;
    const endsAt = Date.now() + durationHours * 60 * 60 * 1000;
    const regionalIncentive = normalizeRegionalIncentive({
      active: true,
      regionId,
      resourceId,
      multiplier,
      endsAt,
      announcedAt: Date.now(),
    });
    if (!regionalIncentive) return false;
    await saveServerBroadcast({
      centralBank: get().centralBank,
      regionalIncentive,
    });
    const logText = buildRegionalIncentiveLogText(regionalIncentive);
    await get().recordAdminOverride({
      actionType: ADMIN_ACTION.REGIONAL_INCENTIVE,
      logText,
      payload: { regionalIncentive },
    });
    let cities = Object.fromEntries(
      Object.entries(get().cities).map(([id]) => [
        id,
        refreshCityMorale({ ...get(), regionalIncentive }, id),
      ]),
    );
    set({ regionalIncentive, cities });
    useNotificationStore.getState().addToast(logText, 'success');
    return true;
  },

  adminClearRegionalIncentive: async () => {
    const playerKey = getCurrentPlayerName();
    if (!canUseAdminOverride(get(), playerKey)) return false;
    await saveServerBroadcast({
      centralBank: get().centralBank,
      regionalIncentive: null,
    });
    const logText = buildRegionalIncentiveLogText(null);
    await get().recordAdminOverride({
      actionType: ADMIN_ACTION.CLEAR_INCENTIVE,
      logText,
      payload: {},
    });
    const cities = Object.fromEntries(
      Object.entries(get().cities).map(([id]) => [
        id,
        refreshCityMorale({ ...get(), regionalIncentive: null }, id),
      ]),
    );
    set({ regionalIncentive: null, cities });
    return true;
  },

  respondToCrisis: (responseKey) => {
    const state = get();
    const crisis = state.activeCrisis;
    if (!crisis?.active || crisis.responded) {
      useNotificationStore.getState().addToast('Aktif kriz yanıtı yok veya zaten yanıtlandı.', 'warn');
      return false;
    }
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city) return false;

    const correct = isCorrectCrisisResponse(state.playerIdeology, responseKey);
    let ok = false;

    if (responseKey === CRISIS_LOYALTY_RESPONSE.socialist_aid) {
      const food = city.resources?.find((r) => r.id === 'food');
      const metal = city.resources?.find((r) => r.id === 'hammadde');
      if ((food?.current ?? 0) >= 800 && (metal?.current ?? 0) >= 500) {
        const resources = city.resources.map((r) => {
          if (r.id === 'food') return { ...r, current: r.current - 800 };
          if (r.id === 'hammadde') return { ...r, current: r.current - 500 };
          return r;
        });
        patchCity(set, get, cityId, { resources: ensureCityResources(resources) });
        ok = true;
      }
    } else if (responseKey === CRISIS_LOYALTY_RESPONSE.capitalist_fund) {
      const money = city.resources?.find((r) => r.id === 'money');
      if ((money?.current ?? 0) >= 18_000) {
        const resources = city.resources.map((r) => (
          r.id === 'money' ? { ...r, current: r.current - 18_000 } : r
        ));
        patchCity(set, get, cityId, { resources: ensureCityResources(resources) });
        ok = true;
      }
    } else if (responseKey === CRISIS_LOYALTY_RESPONSE.technocrat_shield) {
      const cyber = city.buildings?.find((b) => b.id === 'cyber_ops');
      const plant = city.buildings?.find((b) => b.id === 'plant');
      const energy = city.resources?.find((r) => r.id === 'energy');
      if ((cyber?.level ?? 0) >= 1 && (energy?.current ?? 0) >= 3000) {
        const resources = city.resources.map((r) => (
          r.id === 'energy' ? { ...r, current: r.current - 3000 } : r
        ));
        patchCity(set, get, cityId, { resources: ensureCityResources(resources) });
        ok = true;
      }
    } else if (responseKey === CRISIS_LOYALTY_RESPONSE.nationalist_mobilize) {
      const troops = city.idleTroops ?? [];
      const total = troops.reduce((s, t) => s + (t.available ?? 0), 0);
      if (total >= 120) {
        ok = true;
      }
    }

    if (!ok) {
      useNotificationStore.getState().addToast('Kriz müdahalesi için kaynak/ordu yetersiz.', 'warn');
      return false;
    }

    const action = correct ? responseKey : LOYALTY_ACTION.CRISIS_WRONG_RESPONSE;
    get().awardLoyalty(action);

    const easedEndsAt = Math.max(Date.now() + 60_000, (crisis.endsAt ?? Date.now()) - 4 * 60 * 1000);
    set({
      activeCrisis: { ...crisis, responded: true, endsAt: easedEndsAt },
    });

    useNotificationStore.getState().addToast(
      correct
        ? `[ KRİZ MÜDAHALE ] Doktrin uyumlu müdahale kayda geçti.`
        : `[ KRİZ MÜDAHALE ] Yanlış protokol — sadakat düştü.`,
      correct ? 'success' : 'warn',
    );
    cloudSync(get, { saveProfile: true, savePlayerMeta: true, cityId });
    return true;
  },

  awardLoyalty: (action) => {
    const state = get();
    const pts = getLoyaltyPoints(state.playerIdeology, action);
    if (!pts) return;
    const next = applyLoyaltyDelta(state.loyaltyScore, pts);
    set({ loyaltyScore: next });
    useNotificationStore.getState().addToast(
      pts > 0 ? `İdeoloji sadakati +${pts}` : `İdeoloji sadakati ${pts}`,
      pts > 0 ? 'success' : 'warn',
    );
    cloudSync(get, { saveProfile: true, savePlayerMeta: true });
  },

  bumpSeasonStat: (key, amount = 1) => {
    const state = get();
    const seasonStats = recordSeasonStat(state.seasonStats, key, amount);
    const derived = refreshEngagementDerived({ ...state, seasonStats });
    set({ seasonStats, ...derived });
    persistEngagement(get);
  },

  refreshEngagement: () => {
    const state = get();
    const derived = refreshEngagementDerived(state);
    set(derived);
    persistEngagement(get);
  },

  recordChronicle: (entry) => {
    if (!entry?.text) return false;
    const state = get();
    const seasonChronicles = appendChronicle(
      state.seasonChronicles ?? createDefaultChronicleState(),
      entry,
    );
    set({ seasonChronicles });
    persistChronicleState(get);
    persistChronicleToServer(entry);
    return true;
  },

  loadHistoryBookArchive: (archiveState) => {
    if (!archiveState) return;
    set({ seasonChronicles: syncSeasonChronicles(archiveState) });
    persistChronicleState(get);
  },

  breakDiplomaticTreaty: (partner) => {
    const state = get();
    const treaties = state.diplomaticTreaties ?? [];
    const treaty = treaties.find((t) => t.partner === partner && t.status === 'active');
    if (!treaty) {
      useNotificationStore.getState().addToast('Aktif anlaşma bulunamadı', 'warn');
      return false;
    }
    const brokenAt = Date.now();
    const diplomaticTreaties = treaties.map((t) => (
      t.partner === partner
        ? { ...t, status: 'broken', brokenAt }
        : t
    ));
    const treatyBreaks = [
      {
        id: genId('brk'),
        partner,
        partnerAlliance: treaty.partnerAlliance,
        playerAlliance: state.playerMeta?.allianceName ?? ALLIANCE,
        brokenAt,
        chronicleRecorded: false,
      },
      ...(state.treatyBreaks ?? []),
    ].slice(0, 24);
    set({ diplomaticTreaties, treatyBreaks });
    const key = getCurrentPlayerName();
    saveDiplomaticTreaties(key, diplomaticTreaties);
    saveTreatyBreaks(key, treatyBreaks);
    get().awardLoyalty(LOYALTY_ACTION.TREATY_VIOLATION);
    useNotificationStore.getState().addToast(
      `${partner} ile ${treaty.type} anlaşması bozuldu — itibar düştü`,
      'warn',
    );
    return true;
  },

  _recordBetrayalChronicleIfNeeded: ({ partner, partnerAlliance }) => {
    const state = get();
    const playerName = getCurrentPlayerName();
    const playerAlliance = state.playerMeta?.allianceName ?? ALLIANCE;
    const entry = buildBetrayalChronicle({
      allianceA: playerAlliance,
      allianceB: partnerAlliance ?? '—',
      attacker: playerName,
      defender: partner,
      partner,
    });
    get().recordChronicle(entry);
    const treatyBreaks = (state.treatyBreaks ?? []).map((b) => (
      b.partner === partner ? { ...b, chronicleRecorded: true } : b
    ));
    set({ treatyBreaks });
    saveTreatyBreaks(getCurrentPlayerName(), treatyBreaks);
  },

  _breakTreatyAndBetray: ({ partner, partnerAlliance }) => {
    const state = get();
    const treaties = state.diplomaticTreaties ?? [];
    const treaty = treaties.find((t) => t.partner === partner && t.status === 'active');
    if (!treaty) return false;
    get().breakDiplomaticTreaty(partner);
    get()._recordBetrayalChronicleIfNeeded({ partner, partnerAlliance: partnerAlliance ?? treaty.partnerAlliance });
    return true;
  },

  proposeDiplomaticAgreement: ({ partner, kind, durationHours }) => {
    const state = get();
    const name = getCurrentPlayerName();
    if (!partner?.trim()) return false;
    const existing = (state.diplomaticTreaties ?? []).find(
      (t) => t.partner === partner && (t.status === 'active' || t.status === TREATY_STATUS.PENDING),
    );
    if (existing) {
      useNotificationStore.getState().addToast('Bu oyuncuyla zaten anlaşma süreci var', 'warn');
      return false;
    }
    let proposal = createTreatyProposal({
      partner: partner.trim(),
      partnerAlliance: '—',
      kind: kind === TREATY_KIND.NAP ? TREATY_KIND.NAP : TREATY_KIND.CEASEFIRE,
      durationHours,
      proposer: name,
    });
    const demoPartners = new Set(['KaraKurt', 'SteelWolf', 'Komutan_Beta']);
    if (demoPartners.has(proposal.partner)) {
      proposal = acceptTreatyProposal(proposal, proposal.partner) ?? proposal;
    }
    const diplomaticTreaties = [proposal, ...(state.diplomaticTreaties ?? [])].slice(0, 32);
    set({ diplomaticTreaties });
    saveDiplomaticTreaties(getCurrentPlayerName(), diplomaticTreaties);
    if (proposal.status === TREATY_STATUS.ACTIVE) {
      const logLine = `[ DİPLOMASİ ] ${proposal.type} yürürlüğe girdi — ${proposal.partner}`;
      set({ newsLog: appendNewsLog(get(), logLine) });
    }
    useNotificationStore.getState().addToast(
      proposal.status === TREATY_STATUS.ACTIVE
        ? `${partner} anlaşmayı onayladı — ${proposal.type} aktif`
        : `${partner} için ${proposal.type} teklifi gönderildi`,
      'success',
    );
    return true;
  },

  acceptDiplomaticAgreement: (treatyId) => {
    const state = get();
    const accepter = getCurrentPlayerName();
    const treaties = state.diplomaticTreaties ?? [];
    const idx = treaties.findIndex((t) => t.id === treatyId);
    if (idx < 0) return false;
    const accepted = acceptTreatyProposal(treaties[idx], accepter);
    if (!accepted) return false;
    const diplomaticTreaties = treaties.map((t, i) => (i === idx ? accepted : t));
    set({ diplomaticTreaties });
    saveDiplomaticTreaties(accepter, diplomaticTreaties);
    if (accepted.status === TREATY_STATUS.ACTIVE) {
      const logLine = `[ DİPLOMASİ ] ${accepted.type} yürürlüğe girdi — ${accepted.partner}`;
      set({ newsLog: appendNewsLog(state, logLine) });
      useNotificationStore.getState().addToast(logLine, 'success');
    }
    return true;
  },

  rejectDiplomaticAgreement: (treatyId) => {
    const state = get();
    const treaties = (state.diplomaticTreaties ?? []).map((t) => (
      t.id === treatyId ? { ...t, status: TREATY_STATUS.REJECTED } : t
    ));
    set({ diplomaticTreaties: treaties });
    saveDiplomaticTreaties(getCurrentPlayerName(), treaties);
    return true;
  },

  postBlackMarketListing: ({ type, title, price, qty, resourceId }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    if (!city) return false;
    const listing = createBlackMarketListing({
      type: type || BLACK_MARKET_TYPES.STOLEN_GOODS,
      title,
      price: Number(price),
      qty: Number(qty) || 1,
      resourceId,
      sellerId: getCurrentPlayerName(),
    });
    if (type === BLACK_MARKET_TYPES.STOLEN_GOODS && resourceId) {
      const res = city.resources.find((r) => r.id === resourceId);
      const need = Math.floor(listing.qty);
      if (!res || res.current < need) {
        useNotificationStore.getState().addToast('Listelemek için yeterli kaynak yok', 'warn');
        return false;
      }
      const resources = city.resources.map((r) => (
        r.id === resourceId ? { ...r, current: r.current - need } : r
      ));
      patchCity(set, get, cityId, { resources: ensureCityResources(resources) });
    }
    set({
      blackMarketListings: [listing, ...(state.blackMarketListings ?? [])].slice(0, 40),
    });
    useNotificationStore.getState().addToast('[ KARA BORSA ] Anonim ilan yayınlandı', 'success');
    return true;
  },

  buyBlackMarketListing: (listingId) => {
    const state = get();
    const listing = (state.blackMarketListings ?? []).find((l) => l.id === listingId && l.status === 'open');
    const cityId = state.activeCityId;
    if (!listing || !cityId) return false;
    if (listing.sellerId === getCurrentPlayerName()) {
      useNotificationStore.getState().addToast('Kendi ilanınızı alamazsınız', 'warn');
      return false;
    }
    if (!canAffordEmpireMoney(state.cities, listing.price)) {
      useNotificationStore.getState().addToast('Yetersiz bütçe', 'warn');
      return false;
    }

    let cities = deductEmpireMoney(state.cities, listing.price, cityId).cities;
    pushBudgetSpendFloat(set, get, listing.price);
    const city = cities[cityId];
    if (listing.resourceId && city) {
      const resources = city.resources.map((r) => {
        if (r.id !== listing.resourceId) return r;
        const next = r.current + listing.qty;
        return { ...r, current: r.max != null ? Math.min(r.max, next) : next };
      });
      cities = { ...cities, [cityId]: { ...city, resources: ensureCityResources(resources) } };
    } else if (listing.type === BLACK_MARKET_TYPES.AGENT_RENTAL) {
      cities = {
        ...cities,
        [cityId]: {
          ...city,
          idleAgents: (city.idleAgents ?? 0) + listing.qty,
        },
      };
    }

    const blackMarketListings = (state.blackMarketListings ?? []).filter((l) => l.id !== listingId);
    let newsLog = state.newsLog;
    let diplomaticCrises = state.diplomaticCrises ?? [];

    if (rollBlackMarketExposure()) {
      const crisis = buildExposureCrisisNews(listing.alias);
      newsLog = appendNewsLog({ ...state, newsLog }, crisis.text);
      diplomaticCrises = [{ ...crisis, id: genId('crisis') }, ...diplomaticCrises].slice(0, 12);
      useNotificationStore.getState().addToast(crisis.text, 'danger');
    } else {
      useNotificationStore.getState().addToast(
        `[ KARA BORSA ] ${listing.alias} — işlem tamamlandı`,
        'success',
      );
    }

    set({ cities, blackMarketListings, newsLog, diplomaticCrises });
    return true;
  },

  createAllianceOperation: ({ targetName }) => {
    const state = get();
    const mapCity = state.mapCities.find((c) => c.name === targetName);
    if (!mapCity) {
      useNotificationStore.getState().addToast('Hedef şehir bulunamadı', 'warn');
      return false;
    }
    const leader = getCurrentPlayerName();
    const op = buildAllianceOperation({
      targetName: mapCity.name,
      targetLat: mapCity.lat,
      targetLng: mapCity.lng,
      leader,
      allianceName: state.playerMeta?.allianceName ?? ALLIANCE,
    });
    set({
      allianceOperations: [op, ...(state.allianceOperations ?? [])].slice(0, 16),
    });
    useNotificationStore.getState().addToast(
      `İttifak operasyonu planlandı: ${targetName}`,
      'info',
    );
    return true;
  },

  approveAllianceOperation: (operationId, { troopQty, syncDelayMinutes = 0 } = {}) => {
    const state = get();
    const op = (state.allianceOperations ?? []).find((o) => o.id === operationId);
    if (!op || op.status !== ALLIANCE_OP_STATUS.PLANNING) return false;

    const mapCity = state.mapCities.find((c) => c.name === op.targetName);
    if (!mapCity) return false;

    const ok = get().startExpedition({
      targetCity: mapCity,
      troopQty: troopQty ?? { infantry: 10 },
      mode: 'attack',
      allianceOperationId: operationId,
    });
    if (!ok) return false;

    const latestExp = get().expeditions[get().expeditions.length - 1];
    const updated = approveAllianceParticipant(op, {
      player: getCurrentPlayerName(),
      expeditionId: latestExp?.id,
      endsAt: latestExp?.endsAt,
      originCityName: latestExp?.originCityName,
    });
    const participants = updated.participants ?? [];
    const baseLaunch = computeCoordinatedLaunchAt(participants, latestExp?.endsAt);
    const delayMs = Math.max(0, Math.floor(Number(syncDelayMinutes) || 0)) * 60 * 1000;
    const launchAt = baseLaunch != null ? baseLaunch + delayMs : null;
    const allianceOperations = (state.allianceOperations ?? []).map((o) => (
      o.id === operationId
        ? { ...updated, launchAt, syncDelayMinutes, status: ALLIANCE_OP_STATUS.PLANNING }
        : o
    ));
    let patch = { allianceOperations };
    if (!op.newsPosted) {
      const logLine = buildOperationNewsText(updated);
      patch = {
        ...patch,
        newsLog: appendNewsLog(state, logLine),
      };
      patch.allianceOperations = allianceOperations.map((o) => (
        o.id === operationId ? { ...o, newsPosted: true } : o
      ));
    }
    set(patch);
    return true;
  },

  addWatchTarget: ({ targetPlayer, mapCity }) => {
    const state = get();
    const city = state.cities[state.activeCityId];
    if (!city || !targetPlayer) return false;

    const check = canAddToWatchlist({
      attackerCity: city,
      researches: state.researches,
      mapCity,
      defenderCity: null,
      targetPlayerName: targetPlayer,
      currentPlayerName: getCurrentPlayerName(),
      idleAgents: city.idleAgents ?? 0,
      watchlist: state.watchlist,
    });
    if (!check.ok) {
      useNotificationStore.getState().addToast(check.reason, 'warn');
      return false;
    }

    const entry = createWatchlistEntry(targetPlayer, mapCity?.name);
    const watchlist = [...state.watchlist, entry];
    patchCity(set, get, state.activeCityId, {
      idleAgents: Math.max(0, (city.idleAgents ?? 0) - WATCHLIST_AGENT_COST),
    });
    set({ watchlist });
    persistEngagement(get);
    useNotificationStore.getState().addToast(
      `${targetPlayer} istihbarat ağına alındı (−${WATCHLIST_AGENT_COST} ajan)`,
      'intel',
    );
    cloudSync(get, { cityId: state.activeCityId });
    return true;
  },

  removeWatchTarget: (targetPlayer) => {
    const state = get();
    const watchlist = state.watchlist.filter((w) => w.targetPlayer !== targetPlayer);
    if (watchlist.length === state.watchlist.length) return false;
    set({ watchlist });
    persistEngagement(get);
    return true;
  },

  claimDailyQuestReward: (questId) => {
    const state = get();
    const result = claimDailyQuest(state.dailyQuests, questId, state.loyaltyScore);
    if (!result.ok) {
      useNotificationStore.getState().addToast(result.reason, 'warn');
      return false;
    }
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const resources = applyQuestResourceReward(city.resources, result.resourceReward);
    patchCity(set, get, cityId, { resources });
    const derived = refreshEngagementDerived({
      ...state,
      dailyQuests: result.questState,
      loyaltyScore: result.loyaltyScore,
    });
    set({ dailyQuests: derived.dailyQuests, loyaltyScore: result.loyaltyScore });
    persistEngagement(get);
    useNotificationStore.getState().addToast(
      `Günlük görev ödülü · +${result.loyaltyGain} sadakat`,
      'success',
    );
    cloudSync(get, { cityId, saveProfile: true });
    return true;
  },

  claimSeasonPrize: (period) => {
    const state = get();
    const block = period === SEASON_PERIOD.MONTHLY
      ? state.seasonEngagement?.monthly
      : state.seasonEngagement?.weekly;
    const score = getPlayerSeasonScore(state.seasonStats, block?.competitionType);
    const board = buildSeasonLeaderboard({
      competitionType: block.competitionType,
      playerName: getCurrentPlayerName(),
      playerScore: score,
    });
    const rank = getPlayerSeasonRank(board, getCurrentPlayerName());
    if (!rank || rank > 3) {
      useNotificationStore.getState().addToast('İlk 3 derece gerekli', 'warn');
      return false;
    }
    const result = claimSeasonReward({
      engagement: state.seasonEngagement,
      period,
      rank,
      loyaltyScore: state.loyaltyScore,
      cosmeticTitles: state.cosmeticTitles,
    });
    if (!result.ok) {
      useNotificationStore.getState().addToast(result.reason, 'warn');
      return false;
    }
    const nextTitles = result.cosmetic && !state.cosmeticTitles.includes(result.cosmetic.label)
      ? [...state.cosmeticTitles, result.cosmetic.label]
      : state.cosmeticTitles;
    const meta = {
      ...state.playerMeta,
      badges: [
        ...(state.playerMeta?.badges ?? []),
        ...(result.cosmetic ? [result.cosmetic.label] : []),
      ],
    };
    set({
      seasonEngagement: result.engagement,
      loyaltyScore: result.loyaltyScore,
      cosmeticTitles: nextTitles,
      playerMeta: meta,
    });
    persistEngagement(get);
    useNotificationStore.getState().addToast(
      `Sezon ödülü: ${result.cosmetic?.badge ?? ''} ${result.cosmetic?.label ?? ''} · +${result.loyaltyGain} sadakat`,
      'success',
    );
    cloudSync(get, { saveProfile: true, savePlayerMeta: true });
    return true;
  },

  pushIntelFeed: (entry) => {
    if (!entry) return;
    const state = get();
    const intelFeed = pruneIntelFeed([entry, ...(state.intelFeed ?? [])]);
    set({ intelFeed });
    persistEngagement(get);
    useNotificationStore.getState().addToast(entry.text, 'intel');
  },

  simulateWatchedTargetActivity: () => {
    const state = get();
    if (!state.watchlist?.length) return;
    const target = state.watchlist[Math.floor(Math.random() * state.watchlist.length)];
    const cities = state.mapCities.filter(
      (c) => c.owner === target.targetPlayer || (c.status === 'bot' && !c.owner),
    );
    const from = cities[0]?.name ?? target.primaryCity ?? 'Bilinmeyen Üs';
    const entry = buildIntelFeedEntry({
      targetPlayer: target.targetPlayer,
      originCity: from,
      targetCity: state.playerCities[0]?.name ?? 'Bölge',
      mode: 'attack',
      type: 'Konvoy / Sefer',
    });
    get().pushIntelFeed(entry);
  },

  getIdeologyChangeCost: () => IDEOLOGY_CHANGE_COST_MONEY,

  revokePeaceForceProtection: () => {
    const key = getCurrentPlayerName();
    saveProtectionEndsAt(key, null);
    set({ protectionEndsAt: null });
    useNotificationStore.getState().addToast(
      '[ BARIŞ GÜCÜ ] Koruma kalkanı kaldırıldı — saldırgan politika ihlali.',
      'warn',
    );
    cloudSync(get, { saveProfile: true });
  },

  _completeMilAiTutorialQuest: (questId) => {
    const state = get();
    const quest = MIL_AI_TUTORIAL_QUESTS.find((q) => q.id === questId);
    if (!quest) return false;
    const done = new Set(normalizeMilAiCompleted(state.milAiCompleted ?? []));
    if (done.has(questId)) return false;
    if (!isQuestComplete(state, quest)) return false;

    const nextDone = [...done, questId];
    const playerKey = getCurrentPlayerName();
    saveMilAiCompleted(playerKey, nextDone);

    let lang = 'tr';
    try {
      lang = localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'tr';
    } catch {
      /* ignore */
    }
    const celebrateText = quest.celebrateKey
      ? translate(lang, quest.celebrateKey)
      : quest.id;

    set({
      milAiCompleted: nextDone,
      milAiCelebration: {
        questId,
        messageKey: quest.celebrateKey,
        at: Date.now(),
      },
    });

    useNotificationStore.getState().addToast(
      `[ GÖREV TAMAMLANDI ] ${celebrateText}`,
      'success',
    );
    cloudSync(get, { saveProfile: true });
    return true;
  },

  completeMilAiQuest: (questId) => get()._completeMilAiTutorialQuest(questId),

  _syncMilAiTutorial: () => {
    const state = get();
    const celebration = state.milAiCelebration;
    if (celebration?.at && Date.now() - celebration.at > 14000) {
      if (state.milAiCelebration) set({ milAiCelebration: null });
    }
    const quest = getNextAutoTutorialQuest(state);
    if (quest) {
      get()._completeMilAiTutorialQuest(quest.id);
    }
  },

  setPlayerIdeology: (ideology, { force = false } = {}) => {
    if (!isValidIdeology(ideology)) return false;
    const state = get();
    if (state.playerIdeology === ideology) return false;

    const progCity = state.cities[state.activeCityId];
    if (!force && progCity && !getProgressionState(progCity).ideologyUnlocked) {
      useNotificationStore.getState().addToast(
        getProgressionState(progCity).locks.ideology ?? 'İdeoloji henüz kilitli.',
        'warn',
      );
      return false;
    }

    const isRegimeChange = Boolean(state.playerIdeology) && !force;
    const previousIdeology = state.playerIdeology;
    const freeWindow = canChangeIdeology(state.protectionEndsAt);
    const playerKey = getCurrentPlayerName();

    if (isRegimeChange && !freeWindow) {
      const budget = getActiveCityMoney(state.cities, state.activeCityId);
      if (budget < IDEOLOGY_CHANGE_COST_MONEY) {
        useNotificationStore.getState().addToast(
          `Rejim değişimi için ${IDEOLOGY_CHANGE_COST_MONEY.toLocaleString('tr-TR')} Bütçe gerekli.`,
          'warn',
        );
        return false;
      }
    }

    const playerKeySave = playerKey;
    savePlayerIdeology(playerKeySave, ideology);
    let protectionEndsAt = state.protectionEndsAt;
    if (!protectionEndsAt) {
      protectionEndsAt = defaultProtectionEndsAt();
      saveProtectionEndsAt(playerKeySave, protectionEndsAt);
    }

    let workingState = { ...state, playerIdeology: ideology, protectionEndsAt };

    if (isRegimeChange && !freeWindow) {
      const cityId = state.activeCityId;
      const city = state.cities[cityId];
      if (city) {
        const resources = (city.resources ?? []).map((r) => (
          r.id === 'money'
            ? { ...r, current: Math.max(0, (r.current ?? 0) - IDEOLOGY_CHANGE_COST_MONEY) }
            : r
        ));
        workingState = {
          ...workingState,
          cities: {
            ...workingState.cities,
            [cityId]: { ...city, resources: ensureCityResources(resources) },
          },
        };
      }
    }

    let cities = refreshAllCitiesMorale(workingState);

    if (isRegimeChange) {
      cities = Object.fromEntries(
        Object.entries(cities).map(([id, c]) => [
          id,
          {
            ...c,
            happiness: Math.max(
              5,
              (c.happiness ?? 72) - REGIME_CHANGE_HAPPINESS_DROP,
            ),
          },
        ]),
      );
    }

    const mapCities = syncMapCitiesForPlayer(
      workingState.mapCities,
      workingState.playerCities,
      playerKey,
      ideology,
    );

    let newsLog = state.newsLog ?? [];
    if (isRegimeChange) {
      const newsItem = {
        id: genId('news'),
        type: 'regime',
        text: buildRegimeChangeNewsText(playerKey),
        time: formatNewsTickerTime(),
        at: Date.now(),
      };
      newsLog = [newsItem, ...newsLog].slice(0, 48);
    }

    set({
      playerIdeology: ideology,
      protectionEndsAt,
      cities,
      mapCities,
      newsLog,
    });
    get().refreshEngagement();

    if (isRegimeChange && previousIdeology) {
      get().recordChronicle(buildRegimeChronicle({
        player: playerKey,
        oldIdeology: previousIdeology,
        newIdeology: ideology,
      }));
    }

    if (isRegimeChange) {
      useNotificationStore.getState().addToast(
        `[ REJİM DEĞİŞİKLİĞİ ] ${formatIdeologyLabel(ideology)} — mutluluk düştü.`,
        'warn',
      );
      cloudSync(get, { saveAllCities: true, saveProfile: true, savePlayerMeta: true });
    } else {
      useNotificationStore.getState().addToast(
        `Siyasi ideoloji: ${formatIdeologyLabel(ideology)}`,
        'success',
      );
      cloudSync(get, { saveProfile: true });
    }
    return true;
  },

  canChangeIdeology: () => canChangeIdeology(get().protectionEndsAt),

  canAffordIdeologyChange: () => {
    const state = get();
    if (canChangeIdeology(state.protectionEndsAt)) return true;
    return getActiveCityMoney(state.cities, state.activeCityId) >= IDEOLOGY_CHANGE_COST_MONEY;
  },

  /** @deprecated setPlayerIdeology kullanın */
  setPlayerGovernance: (style, opts) => get().setPlayerIdeology(style, opts),

  getCyberCapabilities: () => {
    if (isDevTestMode()) return getDevTestCyberCapabilities();
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

    const devBypass = bypassWarLocksForDevTest();
    let ability;
    if (devBypass) {
      ability = getCyberAbilityById(abilityId) ?? CYBER_ABILITIES[0];
      if (!ability) return false;
    } else {
      const check = canLaunchCyberAbility(city, abilityId);
      if (!check.ok) {
        useNotificationStore.getState().addToast(check.reason, 'warn');
        return false;
      }
      ability = check.ability;
    }

    const agents = Math.max(1, Math.floor(Number(agentCount) || 1));
    if (!devBypass && (city.idleAgents ?? 0) < agents) {
      useNotificationStore.getState().addToast('Yetersiz siber ajan', 'warn');
      return false;
    }

    if (!devBypass && !canAffordCost(ability.cost, 1, city.resources)) {
      useNotificationStore.getState().addToast('Siber operasyon için yetersiz kaynak', 'warn');
      return false;
    }

    const popCost = devBypass ? 0 : getAgentPopulationCost(agents);
    if (!devBypass && !canAffordPopulation(city, popCost)) {
      useNotificationStore.getState().addToast('Nüfus yetersiz — ajan konvoyu', 'warn');
      return false;
    }

    const isOwn = state.playerCities.some((pc) => pc.name === targetCity.name);
    if (isOwn) {
      useNotificationStore.getState().addToast('Kendi üssünüze siber saldırı gönderilemez', 'warn');
      return false;
    }

    if (!applyPeaceForceGate(get, targetCity, 'cyber')) return false;

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

    const resources = devBypass
      ? city.resources
      : deductCost(ability.cost, 1, city.resources);
    const withPop = devBypass
      ? { ...city, resources, idleAgents: city.idleAgents ?? 0 }
      : deductPopulation(
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
      mapRouteSyncRev: (state.mapRouteSyncRev ?? 0) + 1,
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
        'KBRN Silah Programı araştırmasını tamamlayın',
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

    if (!applyPeaceForceGate(get, targetCity, 'kbrn')) return false;

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
    const tickElapsed = Math.max(0.5, (now - (state.lastTickAt ?? now)) / 1000);
    let resources = activeCity.resources.map((r) => {
      const frozen = r.max != null && r.current > r.max;
      if (frozen) return r;
      const increment = ratePerSecond(r.rate);
      let next = r.current + increment;
      if (r.max != null) next = Math.min(r.max, next);
      const rounded = Math.floor(next);
      if (rounded > Math.floor(r.current)) flashes[r.id] = true;
      return { ...r, current: rounded };
    });
    resources = applyAiCenterEnergyDrain(resources, activeCity, tickElapsed);
    resources = applyAiResourceAutoBalanceTick(resources, activeCity, tickElapsed);
    if (flashes.hammadde) {
      const metalRate = activeCity.resources.find((r) => r.id === 'hammadde')?.rate ?? '+0/sa';
      get().bumpSeasonStat('hammaddeProduced', Math.max(1, Math.floor(ratePerSecond(metalRate) * tickElapsed)));
    }

    const engagementTick = (state._engagementTick ?? 0) + 1;
    if (engagementTick % 45 === 0) get().refreshEngagement();
    if (engagementTick % 280 === 0 && state.watchlist?.length) {
      get().simulateWatchedTargetActivity();
    }
    set({ _engagementTick: engagementTick });

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
    const moneyBeforeTick = sumPlayerMoney(stateBeforeQueues.cities);
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

    const crisisState = {
      ...get(),
      cities,
      now,
      ...(cbrnPatch?.globalCbrnOutbreak != null ? { globalCbrnOutbreak: cbrnPatch.globalCbrnOutbreak } : {}),
      ...(cbrnPatch?.newsLog ? { newsLog: cbrnPatch.newsLog } : {}),
    };
    const crisisPatch = tickCrisisWorldEvents(crisisState, now);
    if (crisisPatch?.cities) {
      const merged = { ...cities, ...crisisPatch.cities };
      cities = Object.fromEntries(
        Object.entries(merged).map(([id, c]) => [
          id,
          refreshCityMorale(
            { ...get(), cities: merged, activeCrisis: crisisPatch.activeCrisis ?? get().activeCrisis, now },
            id,
          ),
        ]),
      );
    }

    const marketTick = (state._openMarketTick ?? 0) + 1;
    if (marketTick % 20 === 0) {
      set(tickOpenMarket(get()));
    }
    set({ _openMarketTick: marketTick });

    const treatyTick = tickTreatyExpiry(get().diplomaticTreaties ?? [], now);
    if (treatyTick.changed) {
      set({ diplomaticTreaties: treatyTick.treaties });
      saveDiplomaticTreaties(getCurrentPlayerName(), treatyTick.treaties);
    }

    const migrationTick = (state._migrationTick ?? 0) + 1;
    const migPatch = tickWarPopulationMigration(
      { ...get(), cities, now, _migrationTick: migrationTick },
      migrationTick,
    );
    if (migPatch) {
      const mergedCities = { ...cities, ...migPatch.cities };
      cities = Object.fromEntries(
        Object.entries(mergedCities).map(([id, c]) => [
          id,
          refreshCityMorale({ ...get(), cities: mergedCities, now }, id),
        ]),
      );
      let newsLog = get().newsLog;
      for (const n of migPatch.news ?? []) {
        newsLog = appendNewsLog({ newsLog }, n.text);
      }
      set({ cities, newsLog, _migrationTick: migrationTick });
    } else {
      set({ _migrationTick: migrationTick });
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
      ...(crisisPatch?.activeCrisis != null ? { activeCrisis: crisisPatch.activeCrisis } : {}),
      ...(crisisPatch?.newsLog ? { newsLog: crisisPatch.newsLog } : {}),
      ...(crisisPatch?.lastCrisisEventAt ? { lastCrisisEventAt: crisisPatch.lastCrisisEventAt } : {}),
      ...(crisisPatch?._crisisTickCount != null ? { _crisisTickCount: crisisPatch._crisisTickCount } : {}),
    });

    if (cbrnPatch?.newsLog?.length) {
      const latest = cbrnPatch.newsLog[0];
      if (latest?.type === 'global-alarm') {
        useNotificationStore.getState().addToast(latest.text, 'danger');
      }
    }
    if (crisisPatch?.newsLog?.length) {
      const latest = crisisPatch.newsLog[0];
      if (latest?.type === 'crisis-emergency' || latest?.type === 'crisis-alarm') {
        useNotificationStore.getState().addToast(latest.text, 'danger');
      }
    }
    if (cbrnPatch?.saveCbrn) {
      cloudSync(get, { saveAllCities: true, savePlayerMeta: true, researches: true });
    }
    if (crisisPatch?.saveCrisis) {
      cloudSync(get, { saveAllCities: true, savePlayerMeta: true, saveProfile: true });
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
    if (completedResearchIds.length > 0) {
      get().awardLoyalty(LOYALTY_ACTION.TECHNOCRAT_RESEARCH_COMPLETE);
      get().bumpSeasonStat('researchCompleted', completedResearchIds.length);
    }

    const moneyAfterTick = sumPlayerMoney(get().cities);
    if (moneyAfterTick - moneyBeforeTick >= CAPITALIST_BUDGET_SURGE_THRESHOLD) {
      get().awardLoyalty(LOYALTY_ACTION.CAPITALIST_BUDGET_SURGE);
    }

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
    get()._syncMilAiTutorial();
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
    get()._syncMilAiTutorial();

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
    get()._syncMilAiTutorial();
    get().bumpSeasonStat('unitsTrained', item.count ?? 1);
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

      if (city && (exp.mode === 'trade' || exp.mode === 'cargo') && exp.tradePayload?.resources) {
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
          exp.mode === 'cargo'
            ? `Hammadde sevkiyatı ${state.playerCities.find((c) => c.id === cityId)?.name ?? 'üse'} iade edildi`
            : `Ticaret kargosu ${state.playerCities.find((c) => c.id === cityId)?.name ?? 'üse'} iade edildi`,
          overflow.length ? 'warn' : 'success',
        );
        syncExp();
        return;
      }

      let nextCity = city;
      if (city && exp.cargoHammadde > 0) {
        const resources = city.resources.map((r) => {
          if (r.id !== CARGO_RESOURCE_ID) return r;
          const next = r.current + exp.cargoHammadde;
          return { ...r, current: r.max != null ? Math.min(r.max, next) : next };
        });
        nextCity = { ...city, resources: ensureCityResources(resources) };
      }

      if (nextCity && exp.troopPayload) {
        const restored = restoreTroopsToCity(nextCity, exp.troopPayload);
        set({
          cities: {
            ...state.cities,
            [cityId]: {
              ...restored,
              idleSpies: restored.idleSpies ?? nextCity.idleSpies,
            },
          },
          expeditions,
          navBadges: {
            ...state.navBadges,
            expeditions: expeditions.length > 0,
          },
        });
      } else if (nextCity && exp.cargoHammadde > 0) {
        set({
          cities: { ...state.cities, [cityId]: nextCity },
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
          : exp.cargoHammadde > 0
            ? `Sefer kargosu ${state.playerCities.find((c) => c.id === cityId)?.name ?? 'üse'} teslim edildi`
            : `Ordu ${state.playerCities.find((c) => c.id === cityId)?.name ?? 'şehre'} döndü`,
        'success',
      );
      syncExp();
      return;
    }

    if (exp.mode === 'cargo' && exp.direction === 'outgoing') {
      const targetPc = state.playerCities.find(
        (c) => c.id === exp.targetCityId || c.name === exp.target,
      );
      const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
      let overflow = [];
      const qty = getCargoAmountFromPayload(exp.tradePayload);

      if (targetPc && exp.tradePayload?.resources) {
        const targetCity = state.cities[targetPc.id];
        if (targetCity) {
          const delivered = applyTradeDelivery(targetCity.resources, exp.tradePayload.resources);
          overflow = delivered.overflow;
          patchCity(set, get, targetPc.id, { resources: delivered.resources });
        }
      }

      const report = generateCargoReport(exp, true, overflow);
      const logLine = `[LOJİSTİK RAPORU] ${exp.originCityName} şehrinden gelen ${qty.toLocaleString('tr-TR')} hammadde sevkiyatı ${exp.target} hedefine ulaştı`;
      set({
        expeditions,
        reports: [report, ...state.reports],
        newsLog: appendNewsLog(state, logLine),
        navBadges: {
          expeditions: expeditions.length > 0,
          reports: true,
        },
      });
      useNotificationStore.getState().addToast(logLine, overflow.length ? 'warn' : 'success');
      syncExp({ reports: [report] });
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
          const tradeMult = getTradeRevenueMultiplier(state.playerIdeology);
          const scaledCargo = scaleTradeWithCentralBank(
            exp.tradePayload.resources,
            tradeMult,
            state.centralBank,
          );
          const delivered = applyTradeDelivery(targetCity.resources, scaledCargo);
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
      if (targetPc && isSocialistAidPayload(exp.tradePayload?.resources)) {
        get().awardLoyalty(LOYALTY_ACTION.SOCIALIST_RESOURCE_AID);
      }
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
      if (cyberResult.success) get().bumpSeasonStat('cyberOpsCount', 1);
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
          city: originCity,
          researches: state.researches,
          buildings: originCity?.buildings ?? [],
          resources: originCity?.resources,
          cyberEffects: originCity?.cyberEffects,
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
    const originCity = state.cities[exp.originCityId];
    const combat = runCombat(attackerCounts, defenderCounts, {
      attackerTacticalMult: getAiCombatTacticalMult(originCity),
    });
    const defenderResources = resolveDefenderDepot(mapCity);
    const loot = combat.attackerWon ? calcRaidLoot(defenderResources, LOOT_RATE) : [];

    const report = buildCombatReport({
      expedition: exp,
      combat,
      loot,
      attackerName: getCurrentPlayerName(),
      defenderName: mapCity?.owner || exp.target,
    });

    const defenderPc = findPlayerCityByMapName(state, mapCity?.name);
    const raidOnly = isRaidOnlyMapTarget(mapCity, defenderPc);
    const conquestCheck = combat.attackerWon && !raidOnly
      ? evaluateConquestAttempt(state, mapCity)
      : { ok: false };

    const wantsConquest = exp.attackIntent === 'conquest';
    if (combat.attackerWon && wantsConquest && conquestCheck.ok) {
      get()._applyColonyConquest({
        expedition: exp,
        mapCity,
        combat,
        mapPlotMatch: (c) =>
          (exp.targetLat != null && c.lat === exp.targetLat && c.lng === exp.targetLng)
          || c.name === mapCity?.name
          || (exp.sourceMapCityName && c.name === exp.sourceMapCityName),
      });
      return;
    }

    if (combat.attackerWon) {
      get().awardLoyalty(LOYALTY_ACTION.NATIONALIST_EXPEDITION_WIN);
      get().bumpSeasonStat('attackWins', 1);
    }

    if (isMajorBattle(combat, { attackerWon: combat.attackerWon })) {
      get().recordChronicle(buildWarChronicleFromCombat({
        combat,
        expedition: exp,
        attackerName: getCurrentPlayerName(),
        defenderName: mapCity?.owner || exp.target,
        decisive: combat.attackerWon,
      }));
    }

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
    let returnDuration = calcExpeditionTravelSeconds({
      origin: targetCoords,
      target: origin,
      troopQty: combat.survivingAttacker,
      mapCities: state.mapCities,
      mode: 'attack',
    });
    returnDuration = applyIdeologyTravelSeconds(returnDuration, state.playerIdeology);
    returnDuration = applyExpeditionTravelSeconds(returnDuration, originCity);
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
          cargoHammadde: exp.cargoHammadde,
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

  _applyColonyConquest: ({ expedition: exp, mapCity, combat, mapPlotMatch }) => {
    const state = get();
    const mapEntry = state.mapCities.find((c) => mapPlotMatch(c)) ?? mapCity;
    const colonyName = mapEntry?.name ?? exp.target;
    let newPlayerCity = buildColonyPlayerCityFromMap(mapEntry, colonyName);
    let cityId = newPlayerCity.id;
    if (state.cities[cityId] || state.playerCities.some((c) => c.id === cityId)) {
      cityId = genId('city');
      newPlayerCity = { ...newPlayerCity, id: cityId };
    }

    const troopPayload = combat?.survivingAttacker ?? exp.troopPayload ?? {};
    const expeditions = state.expeditions.filter((e) => e.id !== exp.id);
    const nextPlayerCities = [...state.playerCities, newPlayerCity];
    const nextMapCities = state.mapCities.map((c) =>
      mapPlotMatch(c)
        ? {
            ...c,
            name: colonyName,
            status: 'own',
            owner: getCurrentPlayerName(),
            ownerIdeology: state.playerIdeology,
            population: c.population || 2400,
            botId: undefined,
            worldRole: c.worldRole,
          }
        : c,
    );

    const cityIdOrigin = exp.originCityId;
    const originCity = state.cities[cityIdOrigin];
    const origin = resolveCityCoords(exp.originCityName, state.playerCities, state.mapCities);
    const targetCoords = { lat: exp.targetLat ?? mapEntry?.lat, lng: exp.targetLng ?? mapEntry?.lng };
    let returnDuration = calcExpeditionTravelSeconds({
      origin: targetCoords,
      target: origin,
      troopQty: troopPayload,
      mapCities: state.mapCities,
      mode: 'attack',
    });
    returnDuration = applyIdeologyTravelSeconds(returnDuration, state.playerIdeology);
    returnDuration = applyExpeditionTravelSeconds(returnDuration, originCity);
    const returnTiming = createQueueTiming(returnDuration);
    const pseudoIdle = landUnits.map((u) => ({
      ...u,
      available: troopPayload[u.id] || 0,
    }));
    const survivorTotal = Object.values(troopPayload).reduce((a, b) => a + (b || 0), 0);

    let nextExpeditions = expeditions;
    if (survivorTotal > 0) {
      nextExpeditions = [
        ...nextExpeditions,
        {
          ...exp,
          id: genId('exp'),
          direction: 'returning',
          type: 'Geri Dönüş',
          troops: formatTroopsSummary(troopPayload, pseudoIdle),
          troopPayload: { ...troopPayload },
          skipCombat: true,
          ...returnTiming,
        },
      ];
    }

    const report = buildCombatReport({
      expedition: exp,
      combat,
      loot: [],
      attackerName: getCurrentPlayerName(),
      defenderName: mapCity?.owner || colonyName,
    });

    set({
      playerCities: nextPlayerCities,
      cities: {
        ...refreshAllCitiesMorale({
          ...state,
          playerCities: nextPlayerCities,
          cities: {
            ...state.cities,
            [cityId]: createFoundCityState(troopPayload, { isCoastal: newPlayerCity.isCoastal }),
          },
        }),
      },
      mapCities: syncMapCitiesForPlayer(
        nextMapCities,
        nextPlayerCities,
        getCurrentPlayerName(),
        state.playerIdeology,
      ),
      expeditions: nextExpeditions,
      reports: [report, ...state.reports],
      navBadges: {
        expeditions: nextExpeditions.length > 0,
        reports: true,
      },
      mapRouteSyncRev: (state.mapRouteSyncRev ?? 0) + 1,
    });

    get().bumpSeasonStat('citiesFounded', 1);
    get().bumpSeasonStat('attackWins', 1);
    get().awardLoyalty(LOYALTY_ACTION.NATIONALIST_EXPEDITION_WIN);
    useNotificationStore.getState().addToast(
      `${colonyName} fethedildi — imparatorluğunuza eklendi`,
      'success',
    );
    syncRegistryFromMap(get().mapCities);
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
    const newPlayerCity = buildColonyPlayerCityFromMap(mapEntry, exp.target);
    newPlayerCity.id = cityId;

    const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);

    const nextPlayerCities = [...state.playerCities, newPlayerCity];
    const nextMapCities = state.mapCities.map((c) =>
      mapPlotMatch(c)
        ? {
            ...c,
            name: exp.target,
            status: 'own',
            owner: getCurrentPlayerName(),
            ownerIdeology: state.playerIdeology,
            population: c.population || 1200,
            botId: undefined,
          }
        : c,
    );

    set({
      playerCities: nextPlayerCities,
      cities: {
        ...refreshAllCitiesMorale({
          ...state,
          playerCities: nextPlayerCities,
          cities: {
            ...state.cities,
            [cityId]: createFoundCityState(troopPayload, { isCoastal: newPlayerCity.isCoastal }),
          },
        }),
      },
      mapCities: syncMapCitiesForPlayer(
        nextMapCities,
        nextPlayerCities,
        getCurrentPlayerName(),
        state.playerIdeology,
      ),
      expeditions,
      navBadges: {
        ...state.navBadges,
        expeditions: expeditions.length > 0,
      },
    });

    get().bumpSeasonStat('citiesFounded', 1);
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

    if (totalUnits >= 40) {
      const at = Date.now();
      const attacker = getCurrentPlayerName();
      get().recordChronicle(createChronicleEntry({
        type: CHRONICLE_TYPES.WAR,
        at,
        text: formatWarChronicle({
          at,
          attacker,
          defender: battle.targetName,
          targetCity: battle.targetName,
          casualties: totalUnits,
          decisive: totalUnits > 0,
          operationType: 'ordu',
        }),
        payload: {
          attacker,
          defender: battle.targetName,
          casualties: totalUnits,
          meydan: true,
        },
      }));
    }

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
    const tutorialState = {
      activeCityId: cityId,
      cities: state.cities,
      milAiCompleted: state.milAiCompleted,
    };
    if (!areTutorialPrerequisitesMet(city, buildingId, tutorialState)) return false;

    const hasActive = city.constructionQueue.some((q) => !q.queued);
    const queued = addToQueue || hasActive;
    const baseDuration = parseTimeToSeconds(spec.time) || 120;
    const duration = applyConstructionDurationSeconds(baseDuration, city);
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
    pushBudgetSpendFloat(set, get, moneyInCost(spec.cost, 1));
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
    const ideologyMult = getProductionDurationMultiplier(state.playerIdeology);
    const milBase = Math.max(
      5,
      Math.round((baseDuration * count * barracksSlow * ideologyMult) / Math.max(0.15, happyMult)),
    );
    const scaledDuration = applyMilitaryProductionDurationSeconds(milBase, city);
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
    pushBudgetSpendFloat(set, get, moneyInCost(costStr, count));
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

    const afterCity = get().cities[cityId];
    const workforceTrigger = afterCity && shouldTriggerPlayerEconomicCrisis(afterCity, afterCity.taxRate);
    if (workforceTrigger && !get().activeCrisis?.active) {
      get()._triggerPlayerEconomicCrisis(cityId, workforceTrigger.reason);
    }
    return true;
  },

  startExpedition: ({
    targetCity,
    troopQty,
    mode = 'attack',
    attackIntent = 'raid',
    newCityName,
    cargoHammadde = 0,
    allianceOperationId = null,
  }) => {
    const state = get();
    const cityId = state.activeCityId;
    const city = state.cities[cityId];
    const devBypass = bypassWarLocksForDevTest();
    const isSpy = mode === 'spy';
    const isFound = mode === 'found';
    const spyCount = troopQty?.spies ?? 0;
    const cargoQty = Math.max(0, Math.floor(Number(cargoHammadde) || 0));

    const isOwnPlayerCity = state.playerCities.some((pc) => pc.name === targetCity.name);
    if (!isFound && isOwnPlayerCity && (isSpy || mode === 'attack')) return false;

    if (!isFound) {
      const peaceMode = isSpy ? 'spy' : mode === 'attack' ? 'attack' : mode;
      if (!applyPeaceForceGate(get, targetCity, peaceMode)) return false;
    }

    if (mode === 'attack' && targetCity.owner && !devBypass) {
      const block = isAttackBlockedByTreaties(state.diplomaticTreaties, targetCity.owner);
      if (block.blocked) {
        useNotificationStore.getState().addToast(block.reason, 'warn');
        return false;
      }
    }

    if (isFound) {
      useNotificationStore.getState().addToast(
        'Koloniler saldırı seferi ile fethedilir — haritadan [ FETİH ] başlatın',
        'warn',
      );
      return false;
    }

    if (isSpy) {
      if (spyCount < 1 || spyCount > city.idleSpies) return false;
    } else {
      const total = Object.values(troopQty).reduce((a, b) => a + (b || 0), 0);
      if (total < 1 && cargoQty < 1) return false;
      for (const t of city.idleTroops) {
        if ((troopQty[t.id] || 0) > t.available) return false;
      }
    }

    let resources = city.resources.map((r) => ({ ...r }));
    if (cargoQty > 0) {
      const hammadde = resources.find((r) => r.id === CARGO_RESOURCE_ID);
      if (!hammadde || hammadde.current < cargoQty) {
        useNotificationStore.getState().addToast('Kargo için yeterli hammadde yok', 'warn');
        return false;
      }
      resources = resources.map((r) => (
        r.id === CARGO_RESOURCE_ID
          ? { ...r, current: r.current - cargoQty }
          : r
      ));
    }

    const troops = formatTroopsSummary(troopQty, city.idleTroops);
    const idleTroops = city.idleTroops.map((t) => ({
      ...t,
      available: Math.max(0, t.available - (troopQty[t.id] || 0)),
    }));
    const idleSpies = isSpy ? Math.max(0, city.idleSpies - spyCount) : city.idleSpies;
    const targetCoords = { lat: targetCity.lat, lng: targetCity.lng };
    const conquestMeta = mode === 'attack'
      ? evaluateConquestAttempt(state, targetCity)
      : { ok: false };
    if (
      mode === 'attack'
      && !devBypass
      && conquestMeta.ok === false
      && conquestMeta.reason
      && !conquestMeta.raidOnly
    ) {
      const defenderPc = findPlayerCityByMapName(state, targetCity.name);
      if (isConquerableMapTarget(targetCity, state) || (targetCity.status === 'bot')) {
        useNotificationStore.getState().addToast(conquestMeta.reason, 'warn');
        return false;
      }
    }

    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const nearestOrigin = getNearestEmpireOrigin(targetCoords, state.playerCities, state.mapCities).origin;
    const origin = (mode === 'attack' && conquestMeta.ok && nearestOrigin)
      ? nearestOrigin
      : resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const expeditionMode = isSpy ? 'spy' : 'attack';
    let duration = isSpy
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
        empireTravelMult: conquestMeta.ok ? conquestMeta.travelMult : 1,
      });
    if (!isSpy) {
      duration = applyIdeologyTravelSeconds(duration, state.playerIdeology);
      duration = applyExpeditionTravelSeconds(duration, city);
    }
    const distKm = getExpeditionDistanceKm(origin, targetCoords);
    const timing = createQueueTiming(duration);

    const expedition = {
      id: genId('exp'),
      originCityId: cityId,
      originCityName,
      target: targetCity.name,
      sourceMapCityName: undefined,
      targetLat: targetCity.lat,
      targetLng: targetCity.lng,
      mode: expeditionMode,
      type: isSpy
        ? 'Casusluk Sondası'
        : (attackIntent === 'conquest' && conquestMeta.ok ? 'Fetih' : 'Yağma'),
      attackIntent: expeditionMode === 'attack' ? attackIntent : undefined,
      direction: 'outgoing',
      troops: isSpy ? `${spyCount} Casus` : troops,
      troopPayload: isSpy ? { spies: spyCount } : { ...troopQty },
      player: getCurrentPlayerName(),
      units: isSpy ? spyCount : Object.values(troopQty || {}).reduce((a, b) => a + (b || 0), 0),
      distance: formatDistanceKm(distKm),
      airRush: !isSpy && isAirOnlyExpedition(troopQty),
      cargoHammadde: cargoQty > 0 ? cargoQty : undefined,
      allianceOperationId: allianceOperationId || undefined,
      transportCargoOnly: cargoQty > 0,
      ...timing,
    };

    set((s) => ({
      cities: {
        ...s.cities,
        [cityId]: {
          ...s.cities[cityId],
          idleTroops,
          idleSpies,
          resources: ensureCityResources(resources),
        },
      },
      expeditions: [...s.expeditions, expedition],
      navBadges: { ...s.navBadges, expeditions: true },
      mapRouteSyncRev: (s.mapRouteSyncRev ?? 0) + 1,
      ...(isSpy ? { milAiScoutLaunched: true } : {}),
    }));

    get().bumpSeasonStat('expeditionsLaunched', 1);

    if (expeditionMode === 'attack' && targetCity.owner) {
      const defender = targetCity.owner;
      const activeTreaty = (get().diplomaticTreaties ?? []).find(
        (t) => t.partner === defender && t.status === 'active',
      );
      if (activeTreaty) {
        get()._breakTreatyAndBetray({
          partner: defender,
          partnerAlliance: activeTreaty.partnerAlliance ?? targetCity.alliance,
        });
      } else {
        const recentBreak = findRecentTreatyBreak(get().treatyBreaks, defender);
        if (recentBreak && !recentBreak.chronicleRecorded) {
          get()._recordBetrayalChronicleIfNeeded({
            partner: defender,
            partnerAlliance: recentBreak.partnerAlliance,
          });
        }
      }
    }

    useNotificationStore.getState().addToast(
      isSpy
        ? `Casuslar ${targetCity.name} yolunda`
        : conquestMeta.ok
          ? `Fetih seferi: ${targetCity.name}`
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

    const moneySend = Math.max(0, Math.floor(Number(sendAmounts.money) || 0));
    const localAmounts = { ...sendAmounts, money: 0 };
    let citiesPatch = { ...state.cities };
    let originPatched = city;
    let resources = deductTradeResources(city.resources, localAmounts);

    if (moneySend > 0) {
      if (!canAffordEmpireMoney(citiesPatch, moneySend)) {
        useNotificationStore.getState().addToast('Ortak bütçede yeterli nakit yok', 'warn');
        return false;
      }
      const treasury = deductEmpireMoney(citiesPatch, moneySend, cityId);
      citiesPatch = treasury.cities;
      originPatched = citiesPatch[cityId];
      resources = originPatched.resources;
    }

    const originCityName = state.playerCities.find((c) => c.id === cityId)?.name ?? cityId;
    const mapTarget = state.mapCities.find((c) => c.name === targetCityName);
    const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const targetCoords = mapTarget
      ? { lat: mapTarget.lat, lng: mapTarget.lng }
      : resolveCityCoords(targetCityName, state.playerCities, state.mapCities);
    let duration = calcExpeditionTravelSeconds({
      origin,
      target: targetCoords,
      troopQty: {},
      mapCities: state.mapCities,
      mode: 'trade',
    });
    duration = applyIdeologyTravelSeconds(duration, state.playerIdeology);
    duration = applyExpeditionTravelSeconds(duration, city);
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

    const flags = markSocialistAidFlag(state.dailyQuestFlags ?? {}, sendAmounts);
    const seasonStats = markTradeVolume(state.seasonStats, sendAmounts);

    set((s) => ({
      cities: { ...citiesPatch, [cityId]: { ...originPatched, resources } },
      expeditions: [...s.expeditions, expedition],
      navBadges: { ...s.navBadges, expeditions: true },
      dailyQuestFlags: flags,
      seasonStats,
    }));
    get().refreshEngagement();
    persistEngagement(get);

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

  startCargoTransfer: ({ targetCityId, amount, logisticsMode = LOGISTICS_MODE.ROAD }) => {
    const qty = Math.max(0, Math.floor(Number(amount) || 0));
    if (qty < 1) {
      useNotificationStore.getState().addToast('Gönderilecek hammadde miktarı girin', 'warn');
      return false;
    }

    const state = get();
    const originCityId = state.activeCityId;
    const originCity = state.cities[originCityId];
    const targetPc = state.playerCities.find((c) => c.id === targetCityId);
    if (!targetPc || targetPc.id === originCityId) {
      useNotificationStore.getState().addToast('Geçerli bir hedef koloni seçin', 'warn');
      return false;
    }

    const targetCityState = state.cities[targetPc.id];
    const hammadde = originCity?.resources?.find((r) => r.id === CARGO_RESOURCE_ID);
    if (!hammadde || hammadde.current < qty) {
      useNotificationStore.getState().addToast('Gönderen şehirde yeterli hammadde yok', 'warn');
      return false;
    }

    const overflow = calcTradeDepotOverflow(
      targetCityState?.resources ?? [],
      { [CARGO_RESOURCE_ID]: qty },
    );
    if (overflow.length > 0) {
      useNotificationStore.getState().addToast('Hedef hammadde deposu dolu', 'warn');
      return false;
    }

    const mode = logisticsMode === LOGISTICS_MODE.AIR ? LOGISTICS_MODE.AIR : LOGISTICS_MODE.ROAD;
    if (!canUseAirLogistics(originCity, targetCityState) && mode === LOGISTICS_MODE.AIR) {
      useNotificationStore.getState().addToast(
        'Havayolu için her iki şehirde Hava Üssü gerekli',
        'warn',
      );
      return false;
    }

    const originCityName = state.playerCities.find((c) => c.id === originCityId)?.name ?? originCityId;
    const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
    const targetCoords = resolveCityCoords(targetPc.name, state.playerCities, state.mapCities);
    const { seconds, distanceKm } = calcCargoTransferDuration({
      originCoords: origin,
      targetCoords,
      mode,
    });

    let airCostPaid = 0;
    let cities = { ...state.cities };
    let originPatched = originCity;

    if (mode === LOGISTICS_MODE.AIR) {
      airCostPaid = calcAirLogisticsCost(distanceKm);
      if (!canAffordEmpireMoney(cities, airCostPaid)) {
        useNotificationStore.getState().addToast('Ortak bütçede yeterli nakit yok', 'warn');
        return false;
      }
      const treasury = deductEmpireMoney(cities, airCostPaid, originCityId);
      cities = treasury.cities;
      originPatched = cities[originCityId];
    }

    const resources = originPatched.resources.map((r) => {
      if (r.id !== CARGO_RESOURCE_ID) return r;
      return { ...r, current: Math.max(0, r.current - qty) };
    });
    cities = { ...cities, [originCityId]: { ...originPatched, resources } };

    const timing = createQueueTiming(seconds);
    const distLabel = distanceKm >= 1 ? `${Math.round(distanceKm)} km` : `${Math.round(distanceKm * 1000)} m`;

    const expedition = {
      id: genId('exp'),
      originCityId,
      originCityName,
      targetCityId: targetPc.id,
      target: targetPc.name,
      targetLat: targetCoords?.lat ?? targetPc.lat,
      targetLng: targetCoords?.lng ?? targetPc.lng,
      mode: 'cargo',
      type: mode === LOGISTICS_MODE.AIR ? 'Hammadde — Havayolu' : 'Hammadde — Karayolu',
      direction: 'outgoing',
      logisticsMode: mode,
      cargoAmount: qty,
      airCostPaid,
      troops: formatCargoAmount(qty),
      tradePayload: buildCargoTransitPayload(qty, mode),
      troopPayload: null,
      player: getCurrentPlayerName(),
      units: 1,
      distance: distLabel,
      durationSeconds: seconds,
      ...timing,
    };

    set((s) => ({
      cities,
      expeditions: [...s.expeditions, expedition],
      navBadges: { ...s.navBadges, expeditions: true },
      mapRouteSyncRev: (s.mapRouteSyncRev ?? 0) + 1,
    }));

    useNotificationStore.getState().addToast(
      `${qty.toLocaleString('tr-TR')} hammadde ${targetPc.name} yolunda (${formatCargoLogisticsLabel(mode)}, ~${formatSeconds(seconds)})`,
      'info',
    );
    cloudSync(get, {
      cityId: originCityId,
      immediate: true,
      expedition: get().expeditions.find((e) => e.id === expedition.id) ?? expedition,
    });
    return true;
  },

  sendIntelOperation: ({ target, opType, opId, agentCount = 1 }) => {
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
      opId: opId ?? null,
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

  setLastViewedLocation: (location) => set({ lastViewedLocation: location ?? null }),

  clearLastViewedLocation: () => set({ lastViewedLocation: null }),

  requestMapTargetPick: (field, returnPath = '/istihbarat') => {
    set({
      mapTargetPickRequest: { field, returnPath },
      mapTargetPickResult: null,
    });
  },

  fulfillMapTargetPick: (cityName) => {
    const req = get().mapTargetPickRequest;
    if (!req || !cityName) return;
    set({
      mapTargetPickResult: { field: req.field, cityName },
      mapTargetPickRequest: null,
    });
  },

  clearMapTargetPick: () => set({
    mapTargetPickRequest: null,
    mapTargetPickResult: null,
  }),

  clearMapTargetPickResult: () => set({ mapTargetPickResult: null }),

  speedUpConstruction: (queueId) => {
    const cityId = get().activeCityId;
    const city = get().cities[cityId];
    const item = city?.constructionQueue?.find((q) => q.id === queueId);
    if (!item || item.queued || item.endsAt == null) return false;

    const now = Date.now();
    const remainingSec = Math.max(0, Math.ceil((item.endsAt - now) / 1000));
    if (remainingSec <= 1) return false;

    const cost = calcConstructionSpeedupDiamondCost(remainingSec);
    const meta = { ...(get().playerMeta ?? loadPlayerMeta()) };
    const balance = getPlayerDiamonds(meta);
    if (balance < cost) {
      useNotificationStore.getState().addToast(
        `Yetersiz elmas — gerekli: ${cost} 💎`,
        'warn',
      );
      return false;
    }

    const newEndsAt = applyConstructionTimeReduction(item.endsAt, now);
    const nextMeta = { ...meta, diamonds: balance - cost };
    savePlayerMeta(nextMeta);

    patchCity(set, get, cityId, {
      constructionQueue: city.constructionQueue.map((q) =>
        (q.id === queueId ? { ...q, endsAt: newEndsAt } : q),
      ),
    });
    set({ playerMeta: nextMeta });
    useNotificationStore.getState().addToast(
      `İnşaat hızlandırıldı (−%90 süre) · ${cost} 💎`,
      'success',
    );
    get().tick();
    return true;
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
    const isAdvancedResearch = research.category === ADVANCED_RESEARCH_CATEGORY
      || research.category === 'kbrn';
    if (isAdvancedResearch && !isKbrnBranchUnlocked(activeCity)) {
      useNotificationStore.getState().addToast(
        'İleri doktrinler için Ar-Ge Merkezi Sv.8 gerekli',
        'warn',
      );
      return false;
    }
    const costStr = scaleAdvancedResearchCost(research.cost, research.level ?? 0, research.category);
    if (!addToQueue && list.some((r) => r.active)) return false;
    if (!canAffordCost(costStr, 1, activeCity.resources)) return false;

    const hasActive = list.some((r) => r.active);
    const queued = addToQueue || hasActive;
    const ideologyMult = getResearchDurationMultiplier(state.playerIdeology);
    const duration = Math.max(
      15,
      Math.round((parseTimeToSeconds(research.time) || 300) * ideologyMult),
    );
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
    const ideologyMult = getResearchDurationMultiplier(get().playerIdeology);
    const duration = Math.max(
      15,
      Math.round((research.durationSeconds || parseTimeToSeconds(research.time) || 300) * ideologyMult),
    );
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
    const refundCost = (research.category === ADVANCED_RESEARCH_CATEGORY || research.category === 'kbrn')
      ? (research.lastPaidCost ?? scaleAdvancedResearchCost(research.cost, Math.max(0, (research.level ?? 1) - 1), research.category))
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

export { formatCityOptionLabel, formatCitySubtitle } from '../lib/cityManagementUi';

export { buildLossRows, CONSTRUCTION_QUEUE_LIMIT };

export function formatQueueRemaining(endsAt, now) {
  return formatSeconds(remainingFromEndsAt(endsAt, now));
}
