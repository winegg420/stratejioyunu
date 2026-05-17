const RANGE_DEG = 2.0;

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

export function getOperationRangeDegrees() {
  return RANGE_DEG;
}

export function getActiveCityCoords(activeCityId, playerCities, mapCities) {
  const pc = playerCities.find((c) => c.id === activeCityId);
  const mc = mapCities.find((c) => c.name === pc?.name && c.status === 'own')
    || mapCities.find((c) => c.status === 'own');
  if (!mc) return null;
  return { lat: mc.lat, lng: mc.lng, name: mc.name };
}

export function isCityInOperationRange(targetCity, activeCityId, playerCities, mapCities) {
  if (!targetCity || targetCity.status === 'own') return true;
  const origin = getActiveCityCoords(activeCityId, playerCities, mapCities);
  if (!origin) return false;
  const dist = haversineKm(origin.lat, origin.lng, targetCity.lat, targetCity.lng);
  const maxKm = RANGE_DEG * 111;
  return dist <= maxKm;
}

export function rangeCircleRadiusMeters() {
  return RANGE_DEG * 111000;
}
