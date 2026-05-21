import { diplomacy, mapCities, reports } from './placeholder';
import { applyProductionFreeze } from '../lib/resourceProduction';
import {
  createStarterBuildings,
  createStarterResearches,
  getStarterIdleTroops,
  getStarterResources,
} from '../lib/buildingUtils';
import { ensureCityResources } from './resourceCatalog';
import { enrichCityModel } from '../lib/cityModel';
import { getDefaultIdlePopulation } from '../lib/populationUtils';
import { loadPlayerMeta } from '../lib/playerMetaStorage';
import { getVipProductionMultiplier } from '../lib/vipPrestige';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import {
  loadMilAiCompleted,
  loadPlayerIdeology,
  loadProtectionEndsAt,
  saveProtectionEndsAt,
} from '../lib/briefingStorage';
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
import { syncDailyQuestsState } from '../lib/dailyQuests';
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

export function createCityState(overrides = {}) {
  const bld = overrides.buildings ?? createStarterBuildings();
  const vipMult = overrides.vipProductionMultiplier
    ?? getVipProductionMultiplier(loadPlayerMeta().vipTier ?? 0);
  const baseResources = ensureCityResources(
    (overrides.resources ?? getStarterResources()).map((r) => ({ ...r })),
  );
  const base = {
    resources: baseResources,
    buildings: bld.map((b) => ({ ...b })),
    idleTroops: (overrides.idleTroops ?? getStarterIdleTroops()).map((t) => ({ ...t })),
    idleSpies: overrides.idleSpies ?? 0,
    idleAgents: overrides.idleAgents ?? 0,
    constructionQueue: overrides.constructionQueue ?? [],
    productionQueue: overrides.productionQueue ?? [],
  };
  const idlePopulation = overrides.idlePopulation ?? getDefaultIdlePopulation(base);
  const cityCtx = enrichCityModel({ ...base, idlePopulation });
  const resources = applyProductionFreeze(
    baseResources,
    bld,
    cityCtx,
    vipMult,
  );
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

export function createInitialGameState(playerMeta = loadPlayerMeta()) {
  const playerKey = getCurrentPlayerName();
  let protectionEndsAt = loadProtectionEndsAt(playerKey);
  if (!protectionEndsAt) {
    protectionEndsAt = createInitialProtectionEndsAt();
    saveProtectionEndsAt(playerKey, protectionEndsAt);
  }

  const playerCities = [
    { id: 'izmir', name: 'İzmir', province: '35', provinceName: 'İzmir', type: 'Kıyı Şehri', lat: 38.42, lng: 27.14 },
    { id: 'cesme', name: 'Çeşme', province: '35', provinceName: 'İzmir', type: 'Kıyı Şehri', lat: 38.32, lng: 26.3 },
  ];

  return {
    activeCityId: 'izmir',
    now: Date.now(),
    lastTickAt: Date.now(),
    playerMeta,
    _cleansingTick: 0,
    mapRouteSyncRev: 0,
    incomingAttacks: [],
    researches: createStarterResearches().map((r) => ({ ...r })),
    playerCities,
    cities: {
      izmir: createCityState({
        buildings: createStarterBuildings(),
        happiness: 72,
        taxRate: 15,
        idleAgents: 0,
        idlePopulation: 1200,
      }),
      cesme: createCityState(),
    },
    mapCities: syncMapCitiesForPlayer(
      mapCities.map((c) => ({ ...c })),
      playerCities,
      getCurrentPlayerName(),
      loadPlayerIdeology(getCurrentPlayerName()),
    ),
    expeditions: [],
    intelOperations: [],
    reports: reports.map((r) => ({ ...r })),
    pastExpeditions: [],
    navBadges: { expeditions: false, reports: false },
    mapFocusRequest: null,
    mapTargetPickRequest: null,
    mapTargetPickResult: null,
    flashes: {},
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
    milAiCompleted: loadMilAiCompleted(playerKey),
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
    marketOffers: [],
  };
}
