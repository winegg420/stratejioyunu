import { mapCities, reports } from './placeholder';
import { applyProductionFreeze } from '../lib/resourceProduction';
import {
  createStarterBuildings,
  createStarterResearches,
  getStarterIdleTroops,
  getStarterResources,
} from '../lib/buildingUtils';
import { getDefaultIdlePopulation } from '../lib/populationUtils';
import { loadPlayerMeta } from '../lib/playerMetaStorage';
import { getVipProductionMultiplier } from '../lib/vipPrestige';

export function createCityState(overrides = {}) {
  const bld = overrides.buildings ?? createStarterBuildings();
  const vipMult = overrides.vipProductionMultiplier
    ?? getVipProductionMultiplier(loadPlayerMeta().vipTier ?? 0);
  const baseResources = (overrides.resources ?? getStarterResources()).map((r) => ({ ...r }));
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
  const resources = applyProductionFreeze(
    baseResources,
    bld,
    { ...base, idlePopulation },
    vipMult,
  );
  return {
    ...base,
    resources,
    idlePopulation,
  };
}

export function createFoundCityState(troopPayload = {}) {
  const idleTroops = getStarterIdleTroops().map((t) => ({
    ...t,
    available: troopPayload[t.id] || 0,
  }));
  return createCityState({ idleTroops, idleSpies: 0 });
}

export function createInitialGameState(playerMeta = loadPlayerMeta()) {
  return {
    activeCityId: 'izmir',
    now: Date.now(),
    playerMeta,
    _cleansingTick: 0,
    mapRouteSyncRev: 0,
    incomingAttacks: [],
    researches: createStarterResearches().map((r) => ({ ...r })),
    playerCities: [
      { id: 'izmir', name: 'İzmir', province: '35', type: 'Kıyı Şehri', lat: 38.42, lng: 27.14 },
      { id: 'cesme', name: 'Çeşme', province: '35', provinceName: 'İzmir', type: 'Kıyı Şehri', lat: 38.32, lng: 26.3 },
    ],
    cities: {
      izmir: createCityState({
        idleAgents: 6,
        idlePopulation: 2400,
        idleTroops: getStarterIdleTroops().map((t) =>
          t.id === 'colonist' ? { ...t, available: 3 } : { ...t, available: 40 },
        ),
        resources: getStarterResources().map((r) => ({
          ...r,
          current: Math.min(r.max ?? r.current * 2, Math.floor((r.current || 0) * 1.5)),
        })),
      }),
      cesme: createCityState(),
    },
    mapCities: mapCities.map((c) => ({ ...c })),
    expeditions: [],
    intelOperations: [],
    reports: reports.map((r) => ({ ...r })),
    pastExpeditions: [],
    navBadges: { expeditions: false, reports: false },
    mapFocusRequest: null,
    flashes: {},
    meydanBattle: null,
  };
}
