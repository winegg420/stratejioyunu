import { computeFeatureCentroid } from './botProvinceAssignment';
import { enrichMapCityWithProvince } from '../map/cityProvinceMatch';
import { normalizeMapCity } from '../map/botCityUtils';

/**
 * Harita arama / şehir seçici — tüm iller (GeoJSON) + mevcut mapCities birleşimi.
 */
export function buildMapCitySearchList(mapCities = [], provinces = null, playerCities = []) {
  const byName = new Map();

  for (const raw of mapCities) {
    const c = enrichMapCityWithProvince(normalizeMapCity(raw), playerCities);
    if (c?.name) byName.set(c.name, c);
  }

  if (provinces?.features?.length) {
    for (const feature of provinces.features) {
      const provinceName = feature.properties?.shapeName;
      if (!provinceName) continue;

      const existing = [...byName.values()].find(
        (c) => c.provinceName === provinceName || c.name === provinceName,
      );
      if (existing) continue;

      const centroid = computeFeatureCentroid(feature);
      if (!centroid) continue;

      const iso = feature.properties?.shapeISO ?? '';
      byName.set(provinceName, enrichMapCityWithProvince({
        name: provinceName,
        provinceName,
        province: String(iso).replace(/^TR-/i, ''),
        lat: centroid.lat,
        lng: centroid.lng,
        status: 'empty',
        owner: null,
      }, playerCities));
    }
  }

  return [...byName.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'tr'),
  );
}
