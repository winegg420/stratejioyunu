import { WORLD_PLAYER_STARTERS } from '../data/worldCitiesCatalog';
import { getMainHqCity } from './worldCitySystem';
import { resolveMapCityByName } from './mapCityResolve';
import { MAP_GEO } from '../map/mapGeoConfig';
import { safeLatLng } from './mapSafeUtils';

/** Ana ülke (Main HQ) koordinatları — ÜSSE ODAKLAN ve aktif üs çizgisi. */
export function resolvePlayerCountryFocus({
  activeCityId,
  playerCities,
  mapCities,
  preferMainHq = true,
} = {}) {
  const playerCity = preferMainHq
    ? getMainHqCity({ playerCities })
    : (playerCities?.find((c) => c.id === activeCityId) ?? playerCities?.[0]);
  if (!playerCity) return null;

  const mapCity = resolveMapCityByName(mapCities, playerCity.name)
    ?? mapCities?.find(
      (c) => c?.name === playerCity.name && (c.status === 'own' || c.status === 'player'),
    )
    ?? mapCities?.find((c) => c?.name === playerCity.name);

  const starter = WORLD_PLAYER_STARTERS.find((s) => s.name === playerCity.name);

  const lat = mapCity?.lat ?? playerCity.lat ?? starter?.lat;
  const lng = mapCity?.lng ?? playerCity.lng ?? starter?.lng;
  const fallback = starter
    ? { lat: starter.lat, lng: starter.lng }
    : MAP_GEO.center;
  const { lat: safeLat, lng: safeLng } = safeLatLng(lat, lng, fallback);

  return {
    lat: safeLat,
    lng: safeLng,
    name: playerCity.name,
    zoom: MAP_GEO.countryFocusZoom ?? 5,
  };
}
