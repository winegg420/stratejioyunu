import { diplomacy, mapCities, reports } from './placeholder';
import { applyProductionFreeze } from '../lib/resourceProduction';
import {
  createStarterBuildings,
  createStarterResearches,
  getStarterIdleTroops,
} from '../lib/buildingUtils';
import { asArray } from '../lib/asArray';
import { ensureCityResources, getStarterResources } from './resourceCatalog';
import { enrichCityModel } from '../lib/cityModel';
import { getDefaultIdlePopulation } from '../lib/populationUtils';
import { loadPlayerMeta } from '../lib/playerMetaStorage';
import { getVipProductionMultiplier } from '../lib/vipPrestige';
/** Store init sırasında playerIdentity → gameStore döngüsünü kırar */
function readBootstrapPlayerKey() {
  if (typeof window === 'undefined') return 'Komutan_Alpha';
  const stored = localStorage.getItem('strateji_player_name')?.trim();
  if (stored && stored !== 'Oyuncu') return stored;
  return 'Komutan_Alpha';
}
import {
  loadMilAiCompleted,
  loadPlayerIdeology,
  loadProtectionEndsAt,
  saveProtectionEndsAt,
} from '../lib/briefingStorage';
import { normalizeMilAiCompleted } from '../lib/milAiTutorialQuests';
import {
  loadCosmeticTitles,
  loadDailyQuestsState,
  loadSeasonEngagement,
  loadSeasonStats,
  loadWatchlist,
} from '../lib/engagementStorage';
import { createInitialProtectionEndsAt } from '../lib/progressionSystem';
import { syncMapCitiesForPlayer } from '../map/mapOwnership';
import { DEFAULT_CENTRAL_BANK } from '../lib/adminOverrideEngine';
import {
  createDefaultSeasonStats,
  createSeasonEngagementState,
  syncSeasonEngagement,
} from '../lib/seasonChampionship';
import { generateDailyQuests, syncDailyQuestsState } from '../lib/dailyQuests';
import {
  createDefaultChronicleState,
  normalizeDiplomaticTreaties,
  syncSeasonChronicles,
} from '../lib/historyBook';
import {
  loadDiplomaticTreaties,
  loadSeasonChronicles,
  loadTreatyBreaks,
} from '../lib/historyBookStorage';
import { loadGameConfig } from '../lib/gameConfig';
import { tickOpenMarket } from '../lib/openMarket';
import { seedMarketPriceHistory } from '../lib/marketPriceHistory';
import { createDefaultDefenseInventory } from '../lib/defenseSystemUtils';
import { pickMainHqStarter, enrichMapCityWithWorld } from '../lib/worldCitySystem';

export function createCityState(overrides = {}) {
  const bld = asArray(overrides.buildings ?? createStarterBuildings());
  const vipMult = overrides.vipProductionMultiplier
    ?? getVipProductionMultiplier(loadPlayerMeta().vipTier ?? 0);
  const starterRows = asArray(
    overrides.resources ?? (typeof getStarterResources === 'function' ? getStarterResources() : []),
  );
  const baseResources = ensureCityResources(
    starterRows.map((r) => ({ ...r })),
  );
  const base = {
    resources: baseResources,
    buildings: bld.map((b) => ({ ...b })),
    idleTroops: asArray(overrides.idleTroops ?? getStarterIdleTroops()).map((t) => ({ ...t })),
    idleSpies: overrides.idleSpies ?? 0,
    idleAgents: overrides.idleAgents ?? 0,
    constructionQueue: overrides.constructionQueue ?? [],
    productionQueue: overrides.productionQueue ?? [],
    defenseInventory: overrides.defenseInventory ?? createDefaultDefenseInventory(),
    defenseQueue: overrides.defenseQueue ?? [],
  };
  const idlePopulation = overrides.idlePopulation ?? getDefaultIdlePopulation(base);
  const cityCtx = enrichCityModel({ ...base, idlePopulation });
  let resources = baseResources;
  try {
    resources = applyProductionFreeze(
      baseResources,
      bld,
      cityCtx,
      vipMult,
    );
  } catch (err) {
    console.error('[createCityState] applyProductionFreeze failed', err);
  }
  resources = asArray(resources);
  return enrichCityModel({
    ...base,
    resources,
    idlePopulation,
  });
}

export function createFoundCityState(troopPayload = {}) {
  const idleTroops = getStarterIdleTroops().map((t) => ({
    ...t,
    available: troopPayload[t.id] || 0,
  }));
  return createCityState({ idleTroops, idleSpies: 0 });
}

/** Store init çökerse — oyun en azından açılır (üretim hesabı atlanır) */
export function createEmergencyGameState(playerMeta = loadPlayerMeta()) {
  const playerKey = readBootstrapPlayerKey();
  const gameConfig = loadGameConfig();
  const mainHq = pickMainHqStarter(playerKey, gameConfig);
  const starterResources = ensureCityResources(getStarterResources());
  const cityId = mainHq.id;
  return {
    activeCityId: cityId,
    gameConfig,
    now: Date.now(),
    lastTickAt: Date.now(),
    playerMeta,
    _cleansingTick: 0,
    mapRouteSyncRev: 0,
    incomingAttacks: [],
    researches: [],
    playerCities: [mainHq],
    cities: {
      [cityId]: enrichCityModel({
        resources: starterResources,
        buildings: [{ id: 'hq', level: 1, built: true, upgrading: false }],
        idleTroops: [],
        idleSpies: 0,
        idleAgents: 0,
        idlePopulation: 1200,
        constructionQueue: [],
        productionQueue: [],
        defenseInventory: createDefaultDefenseInventory(),
        defenseQueue: [],
        happiness: 72,
        taxRate: 15,
      }),
    },
    mapCities: [],
    expeditions: [],
    intelOperations: [],
    reports: [],
    pastExpeditions: [],
    navBadges: { expeditions: false, reports: false },
    mapFocusRequest: null,
    lastViewedLocation: null,
    mapTargetPickRequest: null,
    mapTargetPickResult: null,
    mapExpeditionLaunchRequest: null,
    flashes: {},
    budgetSpendFloats: [],
    meydanBattle: null,
    cyberOpsLog: [],
    globalCbrnOutbreak: null,
    activeCrisis: null,
    newsLog: [],
    playerIdeology: loadPlayerIdeology(playerKey),
    protectionEndsAt: loadProtectionEndsAt(playerKey) ?? createInitialProtectionEndsAt(),
    milAiCompleted: [],
    loyaltyScore: 0,
    seasonStats: createDefaultSeasonStats(),
    seasonEngagement: createSeasonEngagementState(),
    dailyQuests: generateDailyQuests(loadPlayerIdeology(playerKey)),
    watchlist: [],
    intelFeed: [],
    cosmeticTitles: [],
    seasonChronicles: createDefaultChronicleState(),
    diplomaticTreaties: [],
    treatyBreaks: [],
    centralBank: { ...DEFAULT_CENTRAL_BANK },
    adminPublicLogs: [],
    isAdminUser: false,
    marketOffers: [],
    openMarketPrices: {},
    blackMarketListings: [],
    allianceOperations: [],
    diplomaticCrises: [],
    marketPriceHistory: {},
    _bootEmergency: true,
  };
}

export function createInitialGameState(playerMeta = loadPlayerMeta()) {
  const playerKey = readBootstrapPlayerKey();
  let protectionEndsAt = loadProtectionEndsAt(playerKey);
  if (!protectionEndsAt) {
    protectionEndsAt = createInitialProtectionEndsAt();
    saveProtectionEndsAt(playerKey, protectionEndsAt);
  }

  const gameConfig = loadGameConfig();
  const mainHq = pickMainHqStarter(playerKey, gameConfig);
  const playerCities = [mainHq];

  const base = {
    activeCityId: mainHq.id,
    gameConfig,
    now: Date.now(),
    lastTickAt: Date.now(),
    playerMeta,
    _cleansingTick: 0,
    mapRouteSyncRev: 0,
    incomingAttacks: [],
    researches: createStarterResearches().map((r) => ({ ...r })),
    playerCities,
    cities: {
      [mainHq.id]: createCityState({
        buildings: createStarterBuildings(),
        happiness: 72,
        taxRate: 15,
        idleAgents: 0,
        idlePopulation: 1200,
      }),
    },
    mapCities: syncMapCitiesForPlayer(
      asArray(mapCities).map((c) => enrichMapCityWithWorld({ ...c }, gameConfig)),
      playerCities,
      playerKey,
      loadPlayerIdeology(playerKey),
    ),
    expeditions: [],
    intelOperations: [],
    reports: [],
    pastExpeditions: [],
    navBadges: { expeditions: false, reports: false },
    mapFocusRequest: null,
    lastViewedLocation: null,
    mapTargetPickRequest: null,
    mapTargetPickResult: null,
    mapExpeditionLaunchRequest: null,
    flashes: {},
    budgetSpendFloats: [],
    meydanBattle: null,
    cyberOpsLog: [],
    globalCbrnOutbreak: null,
    activeCrisis: null,
    lastCrisisEventAt: 0,
    _crisisTickCount: 0,
    newsLog: [],
    lastCbrnEventAt: 0,
    _cbrnTickCount: 0,
    playerIdeology: loadPlayerIdeology(playerKey),
    protectionEndsAt,
    ideologyChangeCooldownAt: playerMeta?.ideologyChangeCooldownAt ?? null,
    milAiCompleted: normalizeMilAiCompleted(loadMilAiCompleted(playerKey)),
    milAiCelebration: null,
    milAiScoutLaunched: false,
    loyaltyScore: 0,
    seasonStats: loadSeasonStats(playerKey) ?? createDefaultSeasonStats(),
    seasonEngagement: syncSeasonEngagement(
      loadSeasonEngagement(playerKey) ?? createSeasonEngagementState(),
    ),
    dailyQuests: syncDailyQuestsState(
      loadDailyQuestsState(playerKey),
      loadPlayerIdeology(playerKey),
    ),
    dailyQuestFlags: {},
    watchlist: loadWatchlist(playerKey),
    intelFeed: [],
    cosmeticTitles: loadCosmeticTitles(playerKey),
    seasonChronicles: syncSeasonChronicles(
      loadSeasonChronicles(playerKey) ?? createDefaultChronicleState(),
    ),
    diplomaticTreaties: normalizeDiplomaticTreaties(
      loadDiplomaticTreaties(playerKey).length
        ? loadDiplomaticTreaties(playerKey)
        : diplomacy.treaties,
    ),
    treatyBreaks: loadTreatyBreaks(playerKey),
    centralBank: { ...DEFAULT_CENTRAL_BANK },
    regionalIncentive: null,
    adminPublicLogs: [],
    isAdminUser: false,
    authEmail: null,
    marketOffers: [
      {
        id: 'npc-offer-1',
        resourceId: 'hammadde',
        qty: 800,
        unitPrice: 68,
        side: 'sell',
        status: 'open',
        author: 'SteelWolf',
        sellerCityId: null,
        at: Date.now(),
      },
      {
        id: 'npc-offer-2',
        resourceId: 'food',
        qty: 1200,
        unitPrice: 11,
        side: 'sell',
        status: 'open',
        author: 'KaraKurt',
        sellerCityId: null,
        at: Date.now(),
      },
    ],
    openMarketPrices: {},
    openMarketSupplyIndex: 0,
    openMarketUpdatedAt: 0,
    blackMarketListings: [],
    allianceOperations: [],
    diplomaticCrises: [],
  };

  const marketTick = tickOpenMarket(base);
  const withMarket = {
    ...base,
    ...marketTick,
    marketPriceHistory: seedMarketPriceHistory(marketTick.openMarketPrices),
  };
  return withMarket;
}
