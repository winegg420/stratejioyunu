/** Harita görünümünde görünür tutulacak noktalar — performans */

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

  const priority = (c) => {
    if (c.isOwn || c.status === 'own') return 0;
    if (c.worldRole === 'mega_city' || c.worldRole === 'bot_capital') return 1;
    if (c.status === 'enemy') return 2;
    if (c.status === 'bot') return 3;
    return 4;
  };

  return [...inView]
    .sort((a, b) => priority(a) - priority(b) || String(a.name).localeCompare(String(b.name), 'tr'))
    .slice(0, max);
}

export function maxLabelsForZoom(zoom) {
  if (zoom >= 6) return 120;
  if (zoom >= 5) return 80;
  if (zoom >= 4) return 48;
  return 0;
}

export function maxDotsForZoom(zoom) {
  if (zoom >= 5) return 200;
  if (zoom >= 3) return 120;
  return 175;
}
