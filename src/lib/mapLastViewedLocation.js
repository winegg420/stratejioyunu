import { enrichMapCityWithProvince, resolveCityProvinceName } from '../map/cityProvinceMatch';

/**
 * @typedef {object} LastViewedLocation
 * @property {string} cityName
 * @property {string|null} [provinceName]
 * @property {string|null} [provinceCode]
 * @property {number} lat
 * @property {number} lng
 * @property {string|null} [status]
 * @property {number|null} [zoom]
 * @property {number|null} [centerLat]
 * @property {number|null} [centerLng]
 * @property {number} viewedAt
 */

/** Haritada seçilen şehir / il — global store için serileştirilmiş kayıt */
export function buildLastViewedFromCity(city, viewport = null) {
  if (!city || city.lat == null || city.lng == null) return null;
  return {
    cityName: city.name ?? city.provinceName ?? 'Bölge',
    provinceName: city.provinceName ?? null,
    provinceCode: city.province ?? null,
    lat: city.lat,
    lng: city.lng,
    status: city.status ?? null,
    zoom: viewport?.zoom ?? null,
    centerLat: viewport?.center?.lat ?? city.lat,
    centerLng: viewport?.center?.lng ?? city.lng,
    viewedAt: Date.now(),
  };
}

/** İl poligonu tıklaması (şehir yok) */
export function buildLastViewedFromProvince({ provinceName, provinceCode, lat, lng, status = 'empty' }) {
  if (lat == null || lng == null) return null;
  return {
    cityName: provinceName ?? 'Bölge',
    provinceName: provinceName ?? null,
    provinceCode: provinceCode ?? null,
    lat,
    lng,
    status,
    zoom: null,
    centerLat: lat,
    centerLng: lng,
    viewedAt: Date.now(),
  };
}

/** Store kaydından harita paneli için şehir nesnesi */
export function resolveMapCityFromLastViewed(last, mapCities, playerCities = []) {
  if (!last) return null;

  let mapCity = mapCities.find((c) => c.name === last.cityName);
  if (!mapCity && last.provinceName) {
    mapCity = mapCities.find(
      (c) => resolveCityProvinceName(c, playerCities) === last.provinceName,
    ) ?? mapCities.find((c) => c.name === last.provinceName);
  }

  if (mapCity) {
    return enrichMapCityWithProvince(mapCity, playerCities);
  }

  if (last.lat == null || last.lng == null) return null;

  return enrichMapCityWithProvince(
    {
      name: last.cityName || last.provinceName || 'Bölge',
      lat: last.lat,
      lng: last.lng,
      provinceName: last.provinceName ?? undefined,
      province: last.provinceCode ?? undefined,
      status: last.status ?? 'empty',
    },
    playerCities,
  );
}
