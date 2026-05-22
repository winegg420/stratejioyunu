import { resolveMapCityOwnerIdeology } from './mapIdeologyDistribution';
import { resolveCityProvinceName } from '../map/cityProvinceMatch';
import { normalizeProvinceCode } from '../map/mapOwnership';

export const BOT_CITY_SUFFIX = ' [BOT]';

export function formatBotCityName(provinceName) {
  const base = String(provinceName ?? '').trim();
  if (!base) return 'Bot Üssü [BOT]';
  if (base.endsWith('[BOT]')) return base;
  return `${base}${BOT_CITY_SUFFIX}`;
}

export function stripBotCitySuffix(name) {
  return String(name ?? '')
    .replace(/\s*\[BOT\]\s*$/i, '')
    .replace(/\s*\[\s*BOT?\s*$/i, '')
    .replace(/\s*\[+\s*$/g, '')
    .trim();
}

/** GeoJSON poligon merkezi (bbox orta noktası) */
export function computeFeatureCentroid(feature) {
  if (!feature?.geometry) return null;

  const rings = [];
  const { type, coordinates } = feature.geometry;
  if (type === 'Polygon') rings.push(coordinates[0]);
  else if (type === 'MultiPolygon') rings.push(coordinates[0]?.[0]);

  const ring = rings.find((r) => r?.length);
  if (!ring?.length) return null;

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  for (const pair of ring) {
    const lng = pair[0];
    const lat = pair[1];
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
}

export function getPlayerProvinceNames(mapCities, playerCities) {
  const names = new Set();
  for (const pc of playerCities ?? []) {
    if (pc.provinceName) names.add(pc.provinceName);
    if (pc.name) names.add(pc.name);
  }
  for (const city of mapCities ?? []) {
    if (city.status !== 'own' && !city.isOwn) continue;
    const province = resolveCityProvinceName(city, playerCities);
    if (province) names.add(province);
  }
  return names;
}

function indexMapCitiesByProvince(mapCities, playerCities) {
  const byProvince = new Map();
  for (const city of mapCities ?? []) {
    const province = resolveCityProvinceName(city, playerCities);
    if (!province) continue;
    if (!byProvince.has(province)) byProvince.set(province, city);
  }
  return byProvince;
}

function createBotMapCity(feature, playerCities) {
  const provinceName = feature.properties?.shapeName ?? 'Üs';
  const iso = feature.properties?.shapeISO ?? '';
  const centroid = computeFeatureCentroid(feature);
  if (!centroid) return null;

  const botId = `Bot_${String(iso).replace(/[^A-Za-z0-9]/g, '_') || provinceName}`;
  const displayName = formatBotCityName(provinceName);

  const draft = {
    name: displayName,
    provinceName,
    province: normalizeProvinceCode(iso.replace(/^TR-/i, '')),
    botId,
    owner: null,
    rank: 'Bot Komutanlığı',
    population: 1800 + (provinceName.length * 37) % 4200,
    type: 'Küçükşehir',
    tier: 'town',
    alliance: null,
    status: 'bot',
    lat: centroid.lat,
    lng: centroid.lng,
  };

  return {
    ...draft,
    ownerIdeology: resolveMapCityOwnerIdeology({ ...draft, status: 'bot' }),
  };
}

function promoteEmptyToBot(city, provinceName) {
  const botId = city.botId ?? `Bot_${provinceName.replace(/\s/g, '_')}`;
  const next = {
    ...city,
    name: formatBotCityName(provinceName),
    provinceName: city.provinceName ?? provinceName,
    status: 'bot',
    botId,
    owner: null,
    population: city.population > 0 ? city.population : 2400,
    alliance: null,
  };
  return {
    ...next,
    ownerIdeology: resolveMapCityOwnerIdeology(next),
  };
}

/**
 * Oyuncu illeri hariç boş kalan tüm illere bot yönetimi atar.
 * Mevcut düşman/bot üslerine dokunmaz.
 */
export function assignBotsToEmptyProvinces({
  mapCities = [],
  playerCities = [],
  provinces = null,
} = {}) {
  if (!provinces?.features?.length) return mapCities;

  const playerProvinces = getPlayerProvinceNames(mapCities, playerCities);
  const byProvince = indexMapCitiesByProvince(mapCities, playerCities);
  const next = [...mapCities];
  const touchedProvinces = new Set();
  let changed = false;

  const upsertCity = (city) => {
    const idx = next.findIndex((c) => c.name === city.name);
    if (idx >= 0) next[idx] = city;
    else next.push(city);
    changed = true;
  };

  for (const feature of provinces.features) {
    const provinceName = feature.properties?.shapeName;
    if (!provinceName || playerProvinces.has(provinceName)) continue;

    const existing = byProvince.get(provinceName);

    if (existing) {
      if (existing.status === 'enemy') continue;
      if (existing.status === 'bot') {
        const renamed = {
          ...existing,
          name: formatBotCityName(provinceName),
          provinceName: existing.provinceName ?? provinceName,
        };
        const withIdeology = {
          ...renamed,
          ownerIdeology: resolveMapCityOwnerIdeology(renamed),
        };
        if (
          !/\[BOT\]/i.test(existing.name ?? '')
          || existing.ownerIdeology !== withIdeology.ownerIdeology
        ) {
          upsertCity(withIdeology);
        }
        continue;
      }
      if (existing.status === 'empty' || !existing.owner) {
        upsertCity(promoteEmptyToBot(existing, provinceName));
        touchedProvinces.add(provinceName);
      }
      continue;
    }

    const botCity = createBotMapCity(feature, playerCities);
    if (botCity) {
      upsertCity(botCity);
      byProvince.set(provinceName, botCity);
      touchedProvinces.add(provinceName);
    }
  }

  return changed ? next : mapCities;
}
