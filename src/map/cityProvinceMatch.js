import { normalizeProvinceCode } from './mapOwnership';

/** Şehir adı → il (shapeName) — ilçe / alt üsler */
const CITY_PROVINCE_ALIASES = {
  Çeşme: 'İzmir',
};

export function resolveCityProvinceName(city, playerCities = []) {
  if (!city) return null;
  if (CITY_PROVINCE_ALIASES[city.name]) return CITY_PROVINCE_ALIASES[city.name];

  const pc = playerCities.find((p) => p.name === city.name);
  if (pc?.provinceName) return pc.provinceName;

  const direct = city.provinceName ?? city.name;
  return direct;
}

export function findProvinceFeature(provinces, city, playerCities = []) {
  if (!provinces?.features?.length || !city) return null;

  const provinceName = resolveCityProvinceName(city, playerCities);
  const pc = playerCities.find((p) => p.name === city.name);
  const iso = pc?.province ? normalizeProvinceCode(pc.province) : null;

  if (iso) {
    const byIso = provinces.features.find(
      (f) => normalizeProvinceCode(f.properties?.shapeISO) === iso,
    );
    if (byIso) return byIso;
  }

  if (provinceName) {
    const byName = provinces.features.find(
      (f) => f.properties?.shapeName === provinceName,
    );
    if (byName) return byName;
  }

  return provinces.features.find((f) => f.properties?.shapeName === city.name) ?? null;
}

export function featureCollectionFromFeature(feature) {
  if (!feature) return null;
  return { type: 'FeatureCollection', features: [feature] };
}
