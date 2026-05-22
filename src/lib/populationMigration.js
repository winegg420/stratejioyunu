import { getExpeditionDistanceKm } from './expeditionTravel';

const TICK_INTERVAL = 120;
const BASE_MIGRANTS_PER_TICK = 8;
const MAX_MIGRANTS_PER_EVENT = 500;
const RECEIVER_HAPPINESS_PENALTY = 3;

function cityUnderWarPressure(cityId, cityName, { incomingAttacks = [], expeditions = [] }) {
  for (const atk of incomingAttacks) {
    if (atk.targetCityId === cityId) return true;
  }
  for (const exp of expeditions) {
    if (exp.direction !== 'outgoing' || exp.mode !== 'attack') continue;
    if (exp.target === cityName) return true;
  }
  return false;
}

function findNeighborReceiverCities(sourcePc, state) {
  const mapEntry = state.mapCities?.find((c) => c.name === sourcePc.name);
  if (!mapEntry) return [];

  const origin = { lat: mapEntry.lat, lng: mapEntry.lng };
  const receivers = [];

  for (const pc of state.playerCities ?? []) {
    if (pc.id === sourcePc.id) continue;
    const mc = state.mapCities?.find((c) => c.name === pc.name);
    if (!mc) continue;
    const dist = getExpeditionDistanceKm(origin, { lat: mc.lat, lng: mc.lng });
    receivers.push({ pc, dist });
  }

  receivers.sort((a, b) => a.dist - b.dist);
  return receivers.slice(0, 3).map((r) => r.pc);
}

export function tickWarPopulationMigration(state, tickCount = 0) {
  if (tickCount % TICK_INTERVAL !== 0) return null;

  const now = Date.now();
  const cities = { ...state.cities };
  const news = [];
  let changed = false;

  for (const pc of state.playerCities ?? []) {
    const city = cities[pc.id];
    if (!city) continue;

    const underWar = cityUnderWarPressure(pc.id, pc.name, {
      incomingAttacks: state.incomingAttacks,
      expeditions: state.expeditions,
    });
    if (!underWar) continue;

    const idle = Math.max(0, Math.floor(city.idlePopulation ?? 0));
    if (idle < 120) continue;

    const neighbors = findNeighborReceiverCities(pc, state);
    if (!neighbors.length) continue;

    const migrants = Math.min(
      MAX_MIGRANTS_PER_EVENT,
      BASE_MIGRANTS_PER_TICK + Math.floor(idle * 0.004),
    );
    const perNeighbor = Math.max(1, Math.floor(migrants / neighbors.length));

    cities[pc.id] = {
      ...city,
      idlePopulation: Math.max(0, idle - perNeighbor * neighbors.length),
    };
    changed = true;

    for (const target of neighbors) {
      const tc = cities[target.id];
      if (!tc) continue;
      cities[target.id] = {
        ...tc,
        idlePopulation: (tc.idlePopulation ?? 0) + perNeighbor,
        happiness: Math.max(0, (tc.happiness ?? 70) - RECEIVER_HAPPINESS_PENALTY),
      };
    }

    news.push({
      at: now,
      type: 'migration',
      text: `${pc.name}'daki çatışmalar nedeniyle ${(perNeighbor * neighbors.length).toLocaleString('tr-TR')} kişi göç etti.`,
    });
  }

  if (!changed) return null;

  return { cities, news };
}
