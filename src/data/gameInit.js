import {
  resources,
  buildings,
  landUnits,
  idleTroops,
  idleSpies,
  constructionQueue,
  productionQueue,
  mapCities,
  reports,
} from './placeholder';
import { parseTimeToSeconds, recalculateResourceRates } from '../lib/gameUtils';

function cloneBuildings(list) {
  return list.map((b) => ({ ...b }));
}

function cloneResources(list) {
  return list.map((r) => ({ ...r }));
}

function mapQueueConstruction(items) {
  return items.map((q, i) => {
    const remainingSeconds = parseTimeToSeconds(q.remaining);
    return {
      id: `cq-${i}`,
      buildingId: q.name === 'Fabrika' ? 'factory' : q.name === 'Ambar' ? 'farm' : 'tax',
      name: q.name,
      targetLevel: q.level,
      remainingSeconds,
      _initialSeconds: remainingSeconds,
      queued: Boolean(q.queued),
    };
  });
}

function mapQueueProduction(items) {
  return items.map((q, i) => {
    const remainingSeconds = parseTimeToSeconds(q.remaining);
    return {
      id: `pq-${i}`,
      unitId: q.unit === 'Piyade' ? 'infantry' : 'tank',
      unit: q.unit,
      count: q.count,
      remainingSeconds,
      _initialSeconds: remainingSeconds,
      queued: Boolean(q.queued),
    };
  });
}

function createCityState(overrides = {}) {
  const bld = cloneBuildings(overrides.buildings ?? buildings);
  const res = recalculateResourceRates(bld, cloneResources(overrides.resources ?? resources));
  return {
    resources: res,
    buildings: bld,
    idleTroops: (overrides.idleTroops ?? idleTroops).map((t) => ({ ...t })),
    idleSpies: overrides.idleSpies ?? idleSpies,
    constructionQueue: overrides.constructionQueue ?? mapQueueConstruction(constructionQueue),
    productionQueue: overrides.productionQueue ?? mapQueueProduction(productionQueue),
  };
}

export function createInitialGameState() {
  return {
    activeCityId: 'izmir',
    playerCities: [
      { id: 'izmir', name: 'İzmir', type: 'Kıyı Şehri', lat: 38.42, lng: 27.14 },
      { id: 'cesme', name: 'Çeşme', type: 'Kıyı Şehri', lat: 38.32, lng: 26.3 },
    ],
    cities: {
      izmir: createCityState(),
      cesme: createCityState({
        resources: resources.map((r) => ({
          ...r,
          current: Math.floor(r.current * 0.6),
        })),
        buildings: buildings.map((b) => ({ ...b, level: Math.max(1, b.level - 2), upgrading: false })),
        idleTroops: idleTroops.map((t) => ({ ...t, available: Math.floor(t.available * 0.4) })),
        idleSpies: 4,
        constructionQueue: [],
        productionQueue: [],
      }),
    },
    mapCities: mapCities.map((c) => ({ ...c })),
    expeditions: [],
    reports: reports.map((r) => ({ ...r })),
    pastExpeditions: [],
    navBadges: { expeditions: false, reports: false },
    flashes: {},
  };
}
