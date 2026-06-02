/**
 * Ülke / bot şehir nüfus ölçeği — dünya haritası (oyun dengesi, gerçek nüfus değil).
 */
import { isMegaCity, resolveCountryIso2 } from '../data/worldCountriesCatalog';
import { WORLD_ROLES } from '../data/worldCitiesCatalog';

function hashString(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** ISO 3166-1 alpha-2 → nüfus bandı (oyun dengesi; göreli sıralama gerçek dünyayla uyumlu) */
const ISO_POP_BANDS = {
  US: [88_000_000, 102_000_000],
  CN: [90_000_000, 105_000_000],
  IN: [86_000_000, 100_000_000],
  RU: [68_000_000, 86_000_000],
  BR: [58_000_000, 76_000_000],
  ID: [52_000_000, 68_000_000],
  PK: [48_000_000, 64_000_000],
  NG: [44_000_000, 58_000_000],
  BD: [42_000_000, 56_000_000],
  MX: [40_000_000, 54_000_000],
  ET: [36_000_000, 48_000_000],
  PH: [34_000_000, 46_000_000],
  EG: [38_000_000, 50_000_000],
  VN: [34_000_000, 46_000_000],
  TR: [36_000_000, 48_000_000],
  DE: [42_000_000, 56_000_000],
  GB: [38_000_000, 50_000_000],
  FR: [36_000_000, 48_000_000],
  IT: [32_000_000, 44_000_000],
  IR: [34_000_000, 46_000_000],
  JP: [28_000_000, 38_000_000],
  ZA: [26_000_000, 36_000_000],
  KR: [24_000_000, 34_000_000],
  ES: [26_000_000, 36_000_000],
  AR: [24_000_000, 34_000_000],
  CA: [22_000_000, 32_000_000],
  AU: [20_000_000, 30_000_000],
  SA: [22_000_000, 32_000_000],
  PL: [20_000_000, 28_000_000],
  UA: [18_000_000, 26_000_000],
  TN: [10_000_000, 14_000_000],
  NL: [14_000_000, 20_000_000],
  BE: [12_000_000, 18_000_000],
  SE: [11_000_000, 16_000_000],
  CH: [10_000_000, 15_000_000],
  NO: [9_000_000, 14_000_000],
  GR: [10_000_000, 15_000_000],
  PT: [9_500_000, 14_000_000],
  IL: [9_000_000, 13_000_000],
  AE: [8_500_000, 12_500_000],
  IQ: [28_000_000, 38_000_000],
};

export function normalizeCountryIso(iso) {
  const raw = String(iso ?? '').trim().toUpperCase();
  if (!raw) return '';
  if (raw.length === 2) return raw;
  const m = raw.match(/-([A-Z]{2})$/);
  return m ? m[1] : raw.slice(0, 2);
}

/** Zoom &lt; 3 — band üst sınırı 50M+ değilse bile ~50M+ ülkeler (harita etiketi) */
const ISO_MAP_LABEL_POP50_STATIC = new Set([
  'TR', 'JP', 'DE', 'GB', 'FR', 'IT', 'KR', 'CO', 'ZA', 'KE', 'MM',
  'EG', 'TH', 'IR', 'PH', 'VN', 'ET', 'CD', 'TZ', 'UG', 'SD', 'DZ', 'AF', 'IQ',
]);

/**
 * Dünya haritası ülke adı etiketi — zoom &lt; 3 için "büyük ülke" filtresi (50M+).
 * @param {string} provinceName GeoJSON shapeName (Türkçe ad)
 * @param {string} [shapeIso]
 */
export function isLargeCountryForMapLabel(provinceName, shapeIso = '') {
  const iso = resolveCountryIso2(provinceName, shapeIso || '') || normalizeCountryIso(shapeIso);
  if (!iso) return false;
  const band = ISO_POP_BANDS[iso];
  if (band && band[1] > 50_000_000) return true;
  return ISO_MAP_LABEL_POP50_STATIC.has(iso);
}

function bandPopulation(min, max, seed) {
  const span = Math.max(1, max - min);
  return min + (hashString(seed) % span);
}

/** Bot ülke / üs nüfusu — ABD ~15M+, küçük ülkeler ~1–3M */
export function computeWorldBotPopulation({
  provinceName = '',
  shapeIso = '',
  worldRole = WORLD_ROLES.BOT_CAPITAL,
  mega = false,
} = {}) {
  const seed = `${provinceName}|${shapeIso}|${worldRole}`;
  if (mega) {
    return bandPopulation(72_000_000, 96_000_000, seed);
  }

  const iso = resolveCountryIso2(provinceName, shapeIso) || normalizeCountryIso(shapeIso);
  const band = ISO_POP_BANDS[iso];
  if (band) {
    return bandPopulation(band[0], band[1], seed);
  }

  if (worldRole === WORLD_ROLES.BOT_CAPITAL || worldRole === WORLD_ROLES.MEGA_CITY) {
    return bandPopulation(8_000_000, 22_000_000, seed);
  }
  if (worldRole === WORLD_ROLES.PLAYER_SLOT) {
    return bandPopulation(6_000_000, 16_000_000, seed);
  }
  if (worldRole === WORLD_ROLES.BOT_COASTAL) {
    return bandPopulation(2_500_000, 9_000_000, seed);
  }
  return bandPopulation(1_500_000, 7_000_000, seed);
}

/** Harita popup — bot ülke nüfusu (eski/küçük kayıtları yok sayar) */
export function resolveMapDisplayPopulation(mapCity) {
  if (!mapCity) return 0;
  if (mapCity.status === 'own') return mapCity.population ?? 0;
  if (mapCity.status !== 'bot' && mapCity.status !== 'empty') {
    return mapCity.population ?? 0;
  }
  const provinceName = mapCity.provinceName ?? mapCity.name ?? '';
  const iso = resolveCountryIso2(provinceName, mapCity.province ?? '');
  const mega = isMegaCity(provinceName);
  return computeWorldBotPopulation({
    provinceName,
    shapeIso: iso,
    worldRole: mapCity.worldRole ?? (mega ? WORLD_ROLES.MEGA_CITY : WORLD_ROLES.BOT_CAPITAL),
    mega,
  });
}
