import {
  recallExpeditionsTargetingCity,
  expeditionTargetsMapCity,
  stripOutgoingExpeditionsToCity,
  fastForwardReturnsFromCleansedCity,
} from './expeditionLifecycle';
import { getInactiveOwners, INACTIVITY_THRESHOLD_MS } from './playerActivityRegistry';
import { getCurrentPlayerName } from './playerIdentity';

export const GHOST_CITY_STATUS = 'ghost';

/** Sekme odağı / visibilitychange temizlik tetikleyicisi için minimum aralık. */
export const WAKE_CLEANSING_THROTTLE_MS = 5 * 60 * 1000;

/** Harita arazisini boş / sahipsiz koloniye çevirir. */
export function liberateMapCity(city) {
  return {
    ...city,
    status: 'empty',
    owner: null,
    rank: null,
    population: 0,
    alliance: null,
    wasGhostCleansed: true,
    ghostCleansedAt: Date.now(),
  };
}

export function isPlayerOwnedMapCity(city, playerName) {
  if (!city || !playerName) return false;
  return city.owner === playerName || (city.status === 'own' && city.owner === playerName);
}

function hasActiveIncomingArmy(expeditions, city) {
  return (expeditions ?? []).some(
    (exp) => expeditionTargetsMapCity(exp, city) && !exp.recalled,
  );
}

/**
 * İnaktif oyuncuların şehirlerini hayalet → boş araziye dönüştürür.
 * Hedefe giden aktif ordu varsa önce üsse geri çağrılır.
 * @returns {{ mapCities, expeditions, cleansedOwners, liberatedCount, recalledCount }}
 */
export function runServerCleansing(mapCities, expeditions = [], now = Date.now()) {
  const inactiveOwners = new Set(getInactiveOwners(now));
  const current = getCurrentPlayerName();
  let liberatedCount = 0;
  let recalledCount = 0;
  let expeditionsNext = [...(expeditions ?? [])];

  const mapCitiesNext = (mapCities ?? []).map((city) => {
    if (!city.owner || city.owner === current) return city;
    if (city.status === 'empty' || city.status === 'bot') return city;
    if (!inactiveOwners.has(city.owner)) return city;

    if (hasActiveIncomingArmy(expeditionsNext, city)) {
      const incoming = expeditionsNext.filter(
        (exp) => expeditionTargetsMapCity(exp, city) && !exp.recalled,
      );
      expeditionsNext = recallExpeditionsTargetingCity(expeditionsNext, city, now);
      recalledCount += incoming.length;
    }

    const liberated = liberateMapCity(city);
    expeditionsNext = stripOutgoingExpeditionsToCity(expeditionsNext, liberated);
    expeditionsNext = fastForwardReturnsFromCleansedCity(expeditionsNext, liberated, now);
    liberatedCount += 1;
    return liberated;
  });

  return {
    mapCities: mapCitiesNext,
    expeditions: expeditionsNext,
    cleansedOwners: [...inactiveOwners],
    liberatedCount,
    recalledCount,
  };
}

export function formatInactivityDays() {
  return Math.round(INACTIVITY_THRESHOLD_MS / (24 * 60 * 60 * 1000));
}
