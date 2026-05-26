/**
 * Küresel harita — makro jeopolitik bölgeler (Türkiye il bölgeleri yerine).
 * lat/lng WGS84; kutular örtüşebilir — ilk eşleşen kazanır.
 */

export const WORLD_MACRO_REGIONS = [
  { id: 'north_america', nameTr: 'Kuzey Amerika', nameEn: 'North America', latMin: 12, latMax: 72, lngMin: -170, lngMax: -52 },
  { id: 'latin_america', nameTr: 'Latin Amerika', nameEn: 'Latin America', latMin: -56, latMax: 32, lngMin: -118, lngMax: -34 },
  { id: 'western_europe', nameTr: 'Batı Avrupa', nameEn: 'Western Europe', latMin: 35, latMax: 72, lngMin: -25, lngMax: 15 },
  { id: 'eastern_europe', nameTr: 'Doğu Avrupa', nameEn: 'Eastern Europe', latMin: 40, latMax: 70, lngMin: 15, lngMax: 60 },
  { id: 'middle_east', nameTr: 'Orta Doğu', nameEn: 'Middle East', latMin: 12, latMax: 42, lngMin: 25, lngMax: 65 },
  { id: 'north_africa', nameTr: 'Kuzey Afrika', nameEn: 'North Africa', latMin: 15, latMax: 38, lngMin: -18, lngMax: 40 },
  { id: 'sub_saharan', nameTr: 'Sahra Altı Afrika', nameEn: 'Sub-Saharan Africa', latMin: -35, latMax: 18, lngMin: -18, lngMax: 52 },
  { id: 'central_asia', nameTr: 'Orta Asya', nameEn: 'Central Asia', latMin: 35, latMax: 55, lngMin: 45, lngMax: 90 },
  { id: 'south_asia', nameTr: 'Güney Asya', nameEn: 'South Asia', latMin: 5, latMax: 38, lngMin: 60, lngMax: 95 },
  { id: 'east_asia', nameTr: 'Doğu Asya', nameEn: 'East Asia', latMin: 18, latMax: 55, lngMin: 95, lngMax: 145 },
  { id: 'southeast_asia', nameTr: 'Güneydoğu Asya', nameEn: 'Southeast Asia', latMin: -12, latMax: 28, lngMin: 92, lngMax: 145 },
  { id: 'oceania', nameTr: 'Okyanusya', nameEn: 'Oceania', latMin: -48, latMax: 12, lngMin: 110, lngMax: 180 },
  { id: 'russia_arctic', nameTr: 'Rusya & Kuzey Kutbu', nameEn: 'Russia & Arctic', latMin: 50, latMax: 82, lngMin: 60, lngMax: 180 },
];

const FALLBACK = { nameTr: 'Küresel Cephe', nameEn: 'Global Theater' };

export function getWorldMacroRegionForCoords(lat, lng, lang = 'tr') {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return lang === 'en' ? FALLBACK.nameEn : FALLBACK.nameTr;
  }
  for (const r of WORLD_MACRO_REGIONS) {
    if (la >= r.latMin && la <= r.latMax && ln >= r.lngMin && ln <= r.lngMax) {
      return lang === 'en' ? r.nameEn : r.nameTr;
    }
  }
  return lang === 'en' ? FALLBACK.nameEn : FALLBACK.nameTr;
}
