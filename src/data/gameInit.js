import { mapCities, reports } from './placeholder';
import { recalculateResourceRates } from '../lib/gameUtils';
import { applyProductionFreeze } from '../lib/resourceProduction';
import {
  createStarterBuildings,
  createStarterResearches,
  getStarterIdleTroops,
  getStarterResources,
} from '../lib/buildingUtils';
import { getDefaultIdlePopulation } from '../lib/populationUtils';

export function createCityState(overrides = {}) {
  const bld = overrides.buildings ?? createStarterBuildings();
  const res = applyProductionFreeze(
    recalculateResourceRates(bld, (overrides.resources ?? getStarterResources()).map((r) => ({ ...r }))),
    bld,
  );
  const base = {
    resources: res,
    buildings: bld.map((b) => ({ ...b })),
    idleTroops: (overrides.idleTroops ?? getStarterIdleTroops()).map((t) => ({ ...t })),
    idleSpies: overrides.idleSpies ?? 0,
    idleAgents: overrides.idleAgents ?? 0,
    constructionQueue: overrides.constructionQueue ?? [],
    productionQueue: overrides.productionQueue ?? [],
  };
  return {
    ...base,
    idlePopulation: overrides.idlePopulation ?? getDefaultIdlePopulation(base),
  };
}

export function createFoundCityState(troopPayload = {}) {
  const idleTroops = getStarterIdleTroops().map((t) => ({
    ...t,
    available: troopPayload[t.id] || 0,
  }));
  return createCityState({ idleTroops, idleSpies: 0 });
}

export function createInitialGameState() {
  return {
    activeCityId: 'izmir',
    now: Date.now(),
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
