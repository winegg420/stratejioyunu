/** Harita görünümünde görünür tutulacak noktalar — performans */

import { isMicroCountry } from './mapMicroCountries';

export function isLatLngInBounds(lat, lng, bounds, paddingDeg = 1.5) {
  if (lat == null || lng == null) return false;
  if (!bounds?.getSouth) return true;
  return (
    lat >= bounds.getSouth() - paddingDeg
    && lat <= bounds.getNorth() + paddingDeg
    && lng >= bounds.getWest() - paddingDeg
    && lng <= bounds.getEast() + paddingDeg
  );
}

/**
 * @param {Array<{ lat?: number, lng?: number, isOwn?: boolean, worldRole?: string, status?: string }>} cities
 * @param {import('leaflet').LatLngBounds|null} bounds
 */
export function filterMapPointsInViewport(cities, bounds, { max = Infinity, paddingDeg = 1.5 } = {}) {
  if (!bounds) return cities.slice(0, max);
  const inView = cities.filter((c) => isLatLngInBounds(c.lat, c.lng, bounds, paddingDeg));
  if (inView.length <= max) return inView;

  const microInView = inView.filter((c) => isMicroCountry(c.name));
  const priority = (c) => {
    if (c.isOwn || c.status === 'own') return 0;
    if (isMicroCountry(c.name)) return 1;
    if (c.status === 'enemy' && c.owner) return 2;
    if (c.worldRole === 'mega_city' || c.worldRole === 'bot_capital') return 3;
    if (c.status === 'enemy') return 4;
    if (c.status === 'bot') return 5;
    return 6;
  };

  const ranked = [...inView]
    .sort((a, b) => priority(a) - priority(b) || String(a.name).localeCompare(String(b.name), 'tr'));
  const picked = ranked.slice(0, max);
  const pickedNames = new Set(picked.map((c) => c.name));
  for (const micro of microInView) {
    if (!pickedNames.has(micro.name)) {
      picked.push(micro);
      pickedNames.add(micro.name);
    }
  }
  return picked;
}

export function maxLabelsForZoom(zoom) {
  if (zoom >= 6) return 120;
  if (zoom >= 5) return 80;
  if (zoom >= 4) return 56;
  if (zoom >= 3) return 36;
  return 16;
}

export function maxDotsForZoom(zoom) {
  if (zoom >= 5) return 220;
  if (zoom >= 4) return 120;
  if (zoom >= 3) return 72;
  if (zoom >= 2) return 140;
  return 80;
}

/** Zoom azaldıkça nokta büyür — mikro ülkeler kaybolmasın */
export function dotPixelSizeForZoom(zoom, isMicro = false) {
  const z = Number(zoom) || 2;
  let size = 6;
  if (z >= 6) size = 11;
  else if (z >= 5) size = 10;
  else if (z >= 4) size = 9;
  else if (z >= 3) size = 8;
  else if (z >= 2) size = 7;
  if (isMicro) size += 3;
  return Math.min(16, size);
}
