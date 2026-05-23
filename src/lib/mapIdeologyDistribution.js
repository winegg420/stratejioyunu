/**
 * Harita ideoloji dağılımı — il / komutan bazlı deterministik çeşitlilik.
 * Aynı tohum her zaman aynı bloku verir; komşu iller farklı renklerle çatışır.
 */
import { stripBotCitySuffix } from './botProvinceAssignment';
import {
  IDEOLOGY_CAPITALIST,
  IDEOLOGY_IDS,
  IDEOLOGY_NATIONALIST,
  IDEOLOGY_SOCIALIST,
  IDEOLOGY_TECHNOCRAT,
  normalizeIdeology,
} from './ideologySystem';

/** Bilinen demo komutanlar — geri kalanlar tohumdan türetilir */
export const DEMO_OWNER_IDEOLOGY = {
  KaraKurt: IDEOLOGY_NATIONALIST,
  SteelWolf: IDEOLOGY_SOCIALIST,
  Falcon99: IDEOLOGY_TECHNOCRAT,
  BorsaKrali: IDEOLOGY_CAPITALIST,
  VatanSavunucu: IDEOLOGY_NATIONALIST,
  KuzeyKartali: IDEOLOGY_TECHNOCRAT,
  EgeBaronu: IDEOLOGY_CAPITALIST,
  AnadoluKizi: IDEOLOGY_SOCIALIST,
};

function hashString(str) {
  let h = 2166136261;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Bölgesel eğilim — sınır bölgelerinde farklı bloklar yan yana */
function regionalIdeologyPool(lat, lng) {
  if (lat == null || lng == null) return IDEOLOGY_IDS;
  if (lng < 29.5) return [IDEOLOGY_CAPITALIST, IDEOLOGY_SOCIALIST, IDEOLOGY_TECHNOCRAT];
  if (lng > 39.5) return [IDEOLOGY_NATIONALIST, IDEOLOGY_TECHNOCRAT, IDEOLOGY_SOCIALIST];
  if (lat < 37.2) return [IDEOLOGY_NATIONALIST, IDEOLOGY_CAPITALIST, IDEOLOGY_SOCIALIST];
  if (lat > 40.5) return [IDEOLOGY_NATIONALIST, IDEOLOGY_SOCIALIST, IDEOLOGY_TECHNOCRAT];
  return [IDEOLOGY_SOCIALIST, IDEOLOGY_NATIONALIST, IDEOLOGY_CAPITALIST, IDEOLOGY_TECHNOCRAT];
}

export function ideologyForMapSeed(seed, coords = {}) {
  const key = String(seed ?? 'map').trim().toLowerCase();
  const h = hashString(key);
  const pool = regionalIdeologyPool(coords.lat, coords.lng);
  const hashIdeology = IDEOLOGY_IDS[h % IDEOLOGY_IDS.length];
  const regionIdeology = pool[(h >> 10) % pool.length];
  const mix = (h >> 6) % 10;
  const picked = mix < 5 ? regionIdeology : hashIdeology;
  const clash = pool[(h >> 14) % pool.length];
  return normalizeIdeology(mix === 7 ? clash : picked);
}

export function ideologyForOwner(ownerName, coords = {}) {
  if (!ownerName) return null;
  if (DEMO_OWNER_IDEOLOGY[ownerName]) {
    return normalizeIdeology(DEMO_OWNER_IDEOLOGY[ownerName]);
  }
  return ideologyForMapSeed(`owner:${ownerName}`, coords);
}

function mapCitySeed(city) {
  return [
    city.provinceName,
    city.province,
    stripBotCitySuffix(city.name),
    city.botId,
    city.owner,
    city.name,
  ].filter(Boolean).join('|');
}

/** Bot / düşman / boş olmayan harita şehri için ideoloji */
export function resolveMapCityOwnerIdeology(city) {
  if (!city) return null;
  const coords = { lat: city.lat, lng: city.lng };

  if (city.status === 'empty' || (!city.owner && city.status !== 'bot')) {
    return ideologyForMapSeed(`empty:${mapCitySeed(city)}`, coords);
  }

  if (city.status === 'bot') {
    return ideologyForMapSeed(`bot:${mapCitySeed(city)}`, coords);
  }

  if (city.owner) {
    const fromDemo = DEMO_OWNER_IDEOLOGY[city.owner];
    if (fromDemo) return normalizeIdeology(fromDemo);
    if (city.ownerIdeology) return normalizeIdeology(city.ownerIdeology);
    return ideologyForOwner(city.owner, coords);
  }

  if (city.ownerIdeology) return normalizeIdeology(city.ownerIdeology);
  return ideologyForMapSeed(mapCitySeed(city), coords);
}
