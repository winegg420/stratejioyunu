import L from 'leaflet';
import { normalizeMapCity } from './botCityUtils';

/** Harita tıklamasında yakın şehir araması (piksel yarıçapı). */
export function buildMapClickCityList(mapCities, playerCities) {
  const byName = new Map();
  for (const raw of mapCities ?? []) {
    const city = normalizeMapCity(raw);
    const pc = playerCities?.find((p) => p.name === city.name);
    byName.set(city.name, {
      ...city,
      lat: pc?.lat ?? city.lat,
      lng: pc?.lng ?? city.lng,
      isOwn: Boolean(pc) || city.status === 'own',
    });
  }
  for (const pc of playerCities ?? []) {
    if (byName.has(pc.name)) continue;
    byName.set(pc.name, {
      name: pc.name,
      lat: pc.lat,
      lng: pc.lng,
      status: 'own',
      isOwn: true,
    });
  }
  return [...byName.values()];
}

export function findMapCityNearPointer(map, latlng, mapCities, playerCities, maxPx = 44) {
  if (!map || !latlng) return null;
  const clickPt = map.latLngToContainerPoint(latlng);
  let best = null;
  let bestDist = maxPx;

  for (const city of buildMapClickCityList(mapCities, playerCities)) {
    if (city.lat == null || city.lng == null) continue;
    const pt = map.latLngToContainerPoint(L.latLng(city.lat, city.lng));
    const dist = Math.hypot(pt.x - clickPt.x, pt.y - clickPt.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}
