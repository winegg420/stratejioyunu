import { getInactiveOwners, INACTIVITY_THRESHOLD_MS } from './playerActivityRegistry';
import { getCurrentPlayerName } from './playerIdentity';

export const GHOST_CITY_STATUS = 'ghost';

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

/**
 * İnaktif oyuncuların şehirlerini hayalet → boş araziye dönüştürür.
 * @returns {{ mapCities, cleansedOwners, liberatedCount }}
 */
export function runServerCleansing(mapCities, now = Date.now()) {
  const inactiveOwners = new Set(getInactiveOwners(now));
  const current = getCurrentPlayerName();
  let liberatedCount = 0;

  const mapCitiesNext = (mapCities ?? []).map((city) => {
    if (!city.owner || city.owner === current) return city;
    if (city.status === 'empty' || city.status === 'bot') return city;
    if (!inactiveOwners.has(city.owner)) return city;

    liberatedCount += 1;
    return liberateMapCity(city);
  });

  return {
    mapCities: mapCitiesNext,
    cleansedOwners: [...inactiveOwners],
    liberatedCount,
  };
}

export function formatInactivityDays() {
  return Math.round(INACTIVITY_THRESHOLD_MS / (24 * 60 * 60 * 1000));
}
