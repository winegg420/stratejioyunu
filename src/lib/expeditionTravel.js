import { airUnits, landUnits } from '../data/placeholder';
import { TURKEY_BOUNDS } from '../map/turkeyBounds';

export const MAX_LAND_EXPEDITION_SECONDS = 5 * 3600;
export const MIN_EXPEDITION_SECONDS = 90;
export const AIR_SPEED_MULTIPLIER = 3;

export const LAND_UNIT_IDS = new Set(landUnits.map((u) => u.id));
/** Saldırı gücü olan hava birlikleri — saf hava seferinde 3× hız. */
export const AIR_COMBAT_UNIT_IDS = new Set(
  airUnits.filter((u) => (u.attack ?? 0) > 0).map((u) => u.id),
);

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180)
    * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let cachedMaxDistKm = null;

export function getMapMaxDistanceKm(mapCities) {
  if (cachedMaxDistKm != null && mapCities?.length) {
    return cachedMaxDistKm;
  }
  const points = mapCities?.length
    ? mapCities.map((c) => ({ lat: c.lat, lng: c.lng }))
    : [
        { lat: TURKEY_BOUNDS.south, lng: TURKEY_BOUNDS.west },
        { lat: TURKEY_BOUNDS.north, lng: TURKEY_BOUNDS.east },
      ];
  let max = 1;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const d = haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (d > max) max = d;
    }
  }
  cachedMaxDistKm = max;
  return max;
}

export function resolveCityCoords(name, playerCities, mapCities) {
  const pc = playerCities?.find((c) => c.name === name);
  if (pc?.lat != null && pc?.lng != null) return { lat: pc.lat, lng: pc.lng };
  const mc = mapCities?.find((c) => c.name === name);
  if (mc) return { lat: mc.lat, lng: mc.lng };
  return null;
}

export function isAirOnlyExpedition(troopQty = {}) {
  const keys = Object.keys(troopQty).filter(
    (k) => k !== 'spies' && (troopQty[k] || 0) > 0,
  );
  if (!keys.length) return false;
  return keys.every((k) => AIR_COMBAT_UNIT_IDS.has(k));
}

export function hasLandTroops(troopQty = {}) {
  return Object.keys(troopQty).some(
    (k) => k !== 'spies' && (troopQty[k] || 0) > 0 && LAND_UNIT_IDS.has(k),
  );
}

/**
 * Kara birimleri: en uzak mesafe = MAX_LAND_EXPEDITION_SECONDS, doğrusal ölçek.
 * Saf hava (savaş uçağı/bombardıman): 3× hız.
 */
export function calcExpeditionTravelSeconds({
  origin,
  target,
  troopQty = {},
  mapCities = [],
  mode = 'attack',
}) {
  if (!origin || !target) {
    if (mode === 'spy') return 35;
    if (mode === 'found') return 90;
    if (mode === 'trade') return 55;
    return 75;
  }

  const distKm = haversineKm(origin.lat, origin.lng, target.lat, target.lng);
  const maxKm = getMapMaxDistanceKm(mapCities);
  const ratio = Math.min(1, Math.max(0, distKm / maxKm));

  let seconds = Math.round(MAX_LAND_EXPEDITION_SECONDS * ratio);
  if (mode === 'spy') seconds = Math.round(seconds * 0.45);
  if (mode === 'trade') seconds = Math.round(seconds * 0.65);

  seconds = Math.max(MIN_EXPEDITION_SECONDS, seconds);

  if (isAirOnlyExpedition(troopQty)) {
    seconds = Math.max(MIN_EXPEDITION_SECONDS, Math.round(seconds / AIR_SPEED_MULTIPLIER));
  }

  return seconds;
}

export function formatDistanceKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Math.round(km)} km`;
}

export function getExpeditionDistanceKm(origin, target) {
  if (!origin || !target) return 0;
  return haversineKm(origin.lat, origin.lng, target.lat, target.lng);
}
