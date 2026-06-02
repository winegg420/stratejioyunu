import { stripBotCitySuffix } from '../lib/botProvinceAssignment';
import { normalizeProvinceCode, provinceCodesMatch } from './mapOwnership';

/** Şehir adı → il (shapeName) — ilçe / alt üsler */
const CITY_PROVINCE_ALIASES = {
  Çeşme: 'İzmir',
};

export function resolveCityProvinceName(city, playerCities = []) {
  if (!city) return null;
  const baseName = stripBotCitySuffix(city.name);
  if (CITY_PROVINCE_ALIASES[city.name] || CITY_PROVINCE_ALIASES[baseName]) {
    return CITY_PROVINCE_ALIASES[city.name] ?? CITY_PROVINCE_ALIASES[baseName];
  }
  if (city.provinceName) return city.provinceName;
  if (/\[BOT\]\s*$/i.test(city.name ?? '')) return stripBotCitySuffix(city.name);

  const pc = playerCities.find((p) => p.name === city.name || p.name === baseName);
  if (pc?.provinceName) return pc.provinceName;

  const direct = city.provinceName ?? baseName ?? city.name;
  return direct;
}

export function findProvinceFeature(provinces, city, playerCities = []) {
  if (!provinces?.features?.length || !city) return null;

  const provinceName = resolveCityProvinceName(city, playerCities);
  const pc = playerCities.find((p) => p.name === city.name);
  const iso = city.province
    ? normalizeProvinceCode(city.province)
    : (pc?.province ? normalizeProvinceCode(pc.province) : null);

  if (iso) {
    const byIso = provinces.features.find((f) =>
      provinceCodesMatch(f.properties?.shapeISO, iso),
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

function isPlayerOwnMapTarget(mapCity, playerCities = []) {
  if (!mapCity) return false;
  if (mapCity.status === 'own' || mapCity.isOwn) return true;

  const norm = (s) => String(s ?? '').trim().toLocaleLowerCase('tr');

  if (mapCity.status === 'bot' || mapCity.status === 'enemy') {
    return playerCities.some((pc) => pc.name && norm(pc.name) === norm(mapCity.name));
  }

  const names = new Set([mapCity.name, mapCity.provinceName].filter(Boolean).map(norm));
  return playerCities.some((pc) => {
    if (pc.name && names.has(norm(pc.name))) return true;
    if (pc.provinceName && names.has(norm(pc.provinceName))) return true;
    const pn = resolveCityProvinceName(pc, playerCities);
    return pn && names.has(norm(pn));
  });
}

/** Harita şehri + oyuncu kaydından il bilgisini birleştir (GeoJSON eşleşmesi için) */
export function enrichMapCityWithProvince(mapCity, playerCities = []) {
  if (!mapCity) return null;
  const pc = playerCities.find(
    (p) => p.name === mapCity.name
      || p.provinceName === mapCity.name
      || p.provinceName === mapCity.provinceName,
  );
  const isOwn = isPlayerOwnMapTarget(mapCity, playerCities);
  return {
    ...mapCity,
    name: pc?.name ?? mapCity.name,
    status: isOwn ? 'own' : mapCity.status,
    isOwn,
    province: pc?.province ?? mapCity.province,
    provinceName: pc?.provinceName ?? mapCity.provinceName ?? resolveCityProvinceName(mapCity, playerCities),
  };
}

export function featureCollectionFromFeature(feature) {
  if (!feature) return null;
  return { type: 'FeatureCollection', features: [feature] };
}
