import { coordsNear } from '../lib/expeditionLifecycle';

export function findMapCityByRef(mapCities, name, lat, lng) {
  if (name) {
    const byName = (mapCities ?? []).find((c) => c.name === name);
    if (byName) return byName;
  }
  if (lat != null && lng != null) {
    return (mapCities ?? []).find((c) => coordsNear(c.lat, c.lng, lat, lng));
  }
  return null;
}

/** Sunucu temizliğiyle boşaltılmış hayalet arazi — neon rota çizilmez. */
export function isCleansedGhostEndpoint(mapCities, name, lat, lng) {
  const city = findMapCityByRef(mapCities, name, lat, lng);
  return city?.status === 'empty' && city?.wasGhostCleansed === true;
}

export function shouldDrawExpeditionRoute(exp, mapCities, endpointName) {
  if (!exp || exp.mode === 'found') return true;
  if (isCleansedGhostEndpoint(mapCities, endpointName, exp.targetLat, exp.targetLng)) {
    return false;
  }
  const city = findMapCityByRef(mapCities, endpointName);
  if (city?.status === 'empty' && exp.mode === 'attack') return false;
  return true;
}
