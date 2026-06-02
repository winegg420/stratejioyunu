import { findProvinceFeature } from './cityProvinceMatch';
import { getFeatureCentroid } from './geoUtils';

/** Harita uçuşu / popup — ülke koordinatı (şehir kaydı yoksa GeoJSON merkezi). */
export function resolveCountryMapCoords(city, provinces = null, playerCities = []) {
  if (!city) return null;
  if (city.lat != null && city.lng != null && Number.isFinite(city.lat) && Number.isFinite(city.lng)) {
    return { lat: city.lat, lng: city.lng };
  }

  if (!provinces?.features?.length) return null;

  const feature = findProvinceFeature(provinces, city, playerCities)
    ?? provinces.features.find((f) => f.properties?.shapeName === city.name)
    ?? provinces.features.find((f) => f.properties?.shapeName === city.provinceName);

  if (!feature) return null;
  return getFeatureCentroid(feature);
}
