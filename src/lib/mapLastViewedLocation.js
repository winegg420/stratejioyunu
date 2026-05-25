import { enrichMapCityWithProvince, resolveCityProvinceName } from '../map/cityProvinceMatch';

/**
 * @typedef {object} LastViewedLocation
 * @property {string|null} [cityName]
 * @property {string|null} [provinceName]
 * @property {string|null} [provinceCode]
 * @property {number} lat
 * @property {number} lng
 * @property {string|null} [status]
 * @property {number|null} [zoom]
 * @property {number|null} [centerLat]
 * @property {number|null} [centerLng]
 * @property {boolean} [panelOpen]
 * @property {number} viewedAt
 */

/** Haritada seçilen şehir / il — global store için serileştirilmiş kayıt */
export function buildLastViewedFromCity(city, viewport = null, { panelOpen = true } = {}) {
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
    panelOpen: Boolean(panelOpen),
    viewedAt: Date.now(),
  };
}

/** Panel kapalı — yalnızca harita viewport'u */
export function buildLastViewedFromViewport(viewport) {
  if (!viewport?.center) return null;
  return {
    cityName: null,
    provinceName: null,
    provinceCode: null,
    lat: viewport.center.lat,
    lng: viewport.center.lng,
    status: null,
    zoom: viewport.zoom ?? null,
    centerLat: viewport.center.lat,
    centerLng: viewport.center.lng,
    panelOpen: false,
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
    panelOpen: true,
    viewedAt: Date.now(),
  };
}

/** Store kaydından harita paneli için şehir nesnesi */
export function resolveMapCityFromLastViewed(last, mapCities, playerCities = []) {
  if (!last?.cityName) return null;

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

/** Geri yükleme uçuşu hedefi — panel kapalıysa viewport merkezi, açıksa şehir koordinatı */
export function resolveRestoreFlyTarget(last) {
  if (!last) return null;
  const panelOpen = last.panelOpen !== false;
  const lat = panelOpen
    ? (last.lat ?? last.centerLat)
    : (last.centerLat ?? last.lat);
  const lng = panelOpen
    ? (last.lng ?? last.centerLng)
    : (last.centerLng ?? last.lng);
  if (lat == null || lng == null) return null;
  return {
    lat,
    lng,
    zoom: last.zoom ?? (panelOpen ? 6 : undefined),
  };
}
