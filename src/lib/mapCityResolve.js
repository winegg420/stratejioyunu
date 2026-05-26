import { normalizeMapCityKey } from './spyIntel';
import { countryNameMatchesQuery, getCountryDisplayLabel } from './countryDisplayNames';

/** Sefer / rapor / arama — kanonik ülke adı ile mapCities eşlemesi */
export function resolveMapCityByName(mapCities, nameOrCity) {
  const raw = typeof nameOrCity === 'string' ? nameOrCity : nameOrCity?.name;
  if (!raw || !mapCities?.length) return null;

  const key = normalizeMapCityKey(raw);
  if (!key) return null;

  for (const city of mapCities) {
    const names = [
      city.name,
      city.provinceName,
      city.sourceMapCityName,
      getCountryDisplayLabel(city.name, 'en'),
      getCountryDisplayLabel(city.name, 'tr'),
    ].filter(Boolean);

    if (names.some((n) => normalizeMapCityKey(n) === key)) {
      return city;
    }
    if (countryNameMatchesQuery(city.name, raw)) {
      return city;
    }
  }

  return null;
}
