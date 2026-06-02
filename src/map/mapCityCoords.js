import { findProvinceFeature, resolveCityProvinceName } from './cityProvinceMatch';
import { getFeatureCentroid } from './geoUtils';

/** Harita flyTo — şehir koordinatı veya GeoJSON ülke merkezi */
export function resolveMapCityLatLng(city, provinces, playerCities = []) {
  if (!city) return null;
  if (city.lat != null && city.lng != null) {
    return { lat: city.lat, lng: city.lng };
  }
  const probe = {
    ...city,
    provinceName: city.provinceName ?? resolveCityProvinceName(city, playerCities),
  };
  const feature = findProvinceFeature(provinces, probe, playerCities);
  const center = feature ? getFeatureCentroid(feature) : null;
  if (!center) return null;
  return { lat: center.lat, lng: center.lng };
}
