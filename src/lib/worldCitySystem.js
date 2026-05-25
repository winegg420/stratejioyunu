import {
  ALL_BOT_PROVINCES,
  CAPITAL_BOT_PROVINCE,
  COASTAL_BOT_SET,
  DEFAULT_GAME_CONFIG,
  INLAND_STARTER_BY_PROVINCE,
  INLAND_STARTER_CITIES,
  PLAYER_CITY_ROLES,
  WORLD_PLAYER_STARTERS,
  WORLD_ROLES,
} from '../data/worldCitiesCatalog';
import { isMegaCity, isPlayerRegisterableCountry } from '../data/worldCountriesCatalog';
import { computeFeatureCentroid, formatBotCityName } from './botProvinceAssignment';
import { resolveMapCityOwnerIdeology } from './mapIdeologyDistribution';
import { normalizeProvinceCode } from '../map/mapOwnership';
import { slugCityId } from './cityIdUtils';

export { PLAYER_CITY_ROLES, WORLD_ROLES };

function hashString(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h);
}

export function normalizeGameConfig(config = {}) {
  return { ...DEFAULT_GAME_CONFIG, ...config };
}

export function isWorldMapMode(gameConfig = DEFAULT_GAME_CONFIG) {
  return normalizeGameConfig(gameConfig).mapMode === 'world';
}

export function resolveProvinceWorldRole(provinceName, gameConfig = DEFAULT_GAME_CONFIG) {
  const cfg = normalizeGameConfig(gameConfig);
  const name = String(provinceName ?? '').trim();
  if (!name) return WORLD_ROLES.WORLD_EMPTY;

  if (isWorldMapMode(cfg)) {
    if (isMegaCity(name)) return WORLD_ROLES.BOT_CAPITAL;
    return WORLD_ROLES.PLAYER_SLOT;
  }

  if (cfg.capitalBotEnabled !== false && name === CAPITAL_BOT_PROVINCE) {
    return WORLD_ROLES.BOT_CAPITAL;
  }
  if (cfg.coastalBotsEnabled !== false && COASTAL_BOT_SET.has(name)) {
    return WORLD_ROLES.BOT_COASTAL;
  }
  if (cfg.inlandStartersEnabled !== false && INLAND_STARTER_BY_PROVINCE.has(name)) {
    return WORLD_ROLES.OPEN_INLAND;
  }
  return WORLD_ROLES.WORLD_EMPTY;
}

export function isProvinceOpenForPlayer(provinceName, gameConfig = DEFAULT_GAME_CONFIG) {
  const cfg = normalizeGameConfig(gameConfig);
  const open = cfg.playerOpenProvinces;
  if (open === 'all_non_mega') {
    return isPlayerRegisterableCountry(provinceName);
  }
  if (open === 'all_inland') {
    return INLAND_STARTER_BY_PROVINCE.has(provinceName)
      || resolveProvinceWorldRole(provinceName, cfg) === WORLD_ROLES.OPEN_INLAND;
  }
  if (Array.isArray(open)) {
    const starter = INLAND_STARTER_BY_PROVINCE.get(provinceName);
    return open.includes(provinceName)
      || open.includes(starter?.province);
  }
  return false;
}

export function pickMainHqStarter(seed = '', gameConfig = DEFAULT_GAME_CONFIG) {
  const cfg = normalizeGameConfig(gameConfig);
  if (isWorldMapMode(cfg)) {
    const pool = WORLD_PLAYER_STARTERS;
    const idx = hashString(seed) % pool.length;
    const pick = pool[idx];
    return {
      id: slugCityId(pick.name),
      name: pick.name,
      province: pick.province,
      provinceName: pick.provinceName,
      district: pick.district ?? 'Merkez',
      type: 'Ulusal Komuta Merkezi',
      lat: pick.lat,
      lng: pick.lng,
      cityRole: PLAYER_CITY_ROLES.MAIN_HQ,
      isUnlosable: true,
      isCoastal: false,
    };
  }

  const pool = INLAND_STARTER_CITIES;
  const idx = hashString(seed) % pool.length;
  const pick = pool[idx];
  return {
    id: slugCityId(pick.name),
    name: pick.name,
    province: pick.province,
    provinceName: pick.provinceName,
    district: pick.district ?? 'Merkez',
    type: 'İç Anadolu Üssü',
    lat: pick.lat,
    lng: pick.lng,
    cityRole: PLAYER_CITY_ROLES.MAIN_HQ,
    isUnlosable: true,
    isCoastal: false,
  };
}

export function getMainHqCity(state) {
  return state.playerCities?.find((c) => c.cityRole === PLAYER_CITY_ROLES.MAIN_HQ)
    ?? state.playerCities?.[0]
    ?? null;
}

export function getPlayerCityRole(playerCity) {
  if (!playerCity) return null;
  if (playerCity.cityRole) return playerCity.cityRole;
  if (playerCity.isUnlosable || playerCity.is_starter) return PLAYER_CITY_ROLES.MAIN_HQ;
  return PLAYER_CITY_ROLES.COLONY;
}

export function isMainHqCity(playerCity) {
  return getPlayerCityRole(playerCity) === PLAYER_CITY_ROLES.MAIN_HQ;
}

export function isColonyCity(playerCity) {
  return getPlayerCityRole(playerCity) === PLAYER_CITY_ROLES.COLONY;
}

export function enrichMapCityWithWorld(city, gameConfig = DEFAULT_GAME_CONFIG) {
  if (!city) return city;
  const provinceName = city.provinceName ?? city.name;
  const worldRole = city.worldRole ?? resolveProvinceWorldRole(provinceName, gameConfig);
  const district = city.district ?? (INLAND_STARTER_BY_PROVINCE.get(provinceName)?.district ?? null);

  let status = city.status;
  if (!city.owner && worldRole === WORLD_ROLES.BOT_COASTAL) status = 'bot';
  if (!city.owner && worldRole === WORLD_ROLES.BOT_CAPITAL) status = 'bot';
  if (!city.owner && worldRole === WORLD_ROLES.PLAYER_SLOT) status = 'bot';

  return {
    ...city,
    province: city.province ?? INLAND_STARTER_BY_PROVINCE.get(provinceName)?.province,
    provinceName,
    district,
    worldRole,
    status,
    isCoastal: worldRole === WORLD_ROLES.BOT_COASTAL
      || String(city.type ?? '').includes('Kıyı'),
  };
}

function createBotWorldCity(feature, worldRole, gameConfig) {
  const provinceName = feature.properties?.shapeName ?? 'Üs';
  const iso = feature.properties?.shapeISO ?? '';
  const centroid = computeFeatureCentroid(feature);
  if (!centroid) return null;

  const mega = isWorldMapMode(gameConfig) && isMegaCity(provinceName);
  const botId = `Bot_${String(iso).replace(/[^A-Za-z0-9]/g, '_') || provinceName}`;
  const displayName = worldRole === WORLD_ROLES.BOT_CAPITAL
    ? provinceName
    : formatBotCityName(provinceName).replace(/\s*\[BOT\]\s*$/i, '').trim() || provinceName;

  const draft = {
    name: displayName,
    provinceName,
    province: normalizeProvinceCode(iso.replace(/^TR-/i, '')),
    district: 'Merkez',
    botId,
    owner: null,
    rank: mega ? 'Mega Şehir Komutanlığı' : (worldRole === WORLD_ROLES.BOT_CAPITAL ? 'Bot Başkent' : 'Bot Kıyı Komutanlığı'),
    population: mega
      ? 48000 + (hashString(provinceName) % 12000)
      : (worldRole === WORLD_ROLES.BOT_CAPITAL ? 22000 : 4200 + (provinceName.length * 41) % 8000),
    type: mega ? 'Mega Şehir' : (worldRole === WORLD_ROLES.BOT_CAPITAL ? 'Başkent' : 'Kıyı'),
    tier: worldRole === WORLD_ROLES.BOT_CAPITAL ? 'capital' : 'town',
    alliance: null,
    status: 'bot',
    lat: centroid.lat,
    lng: centroid.lng,
    worldRole: mega ? WORLD_ROLES.MEGA_CITY : worldRole,
    isCoastal: worldRole === WORLD_ROLES.BOT_COASTAL,
  };

  return enrichMapCityWithWorld({
    ...draft,
    ownerIdeology: resolveMapCityOwnerIdeology(draft),
  }, gameConfig);
}

function createPlayerSlotMapCity(feature, gameConfig) {
  const provinceName = feature.properties?.shapeName ?? '';
  const iso = feature.properties?.shapeISO ?? '';
  const centroid = computeFeatureCentroid(feature);
  if (!centroid || !provinceName) return null;

  const draft = {
    name: provinceName,
    provinceName,
    province: iso,
    district: 'Merkez',
    botId: `Slot_${String(iso).replace(/[^A-Za-z0-9]/g, '_') || provinceName}`,
    owner: null,
    population: 600 + (hashString(provinceName) % 2400),
    type: 'Boş Ülke',
    tier: 'town',
    status: 'bot',
    lat: centroid.lat,
    lng: centroid.lng,
    worldRole: WORLD_ROLES.PLAYER_SLOT,
    isCoastal: false,
  };

  return enrichMapCityWithWorld({
    ...draft,
    ownerIdeology: resolveMapCityOwnerIdeology(draft),
  }, gameConfig);
}

function createOpenInlandMapCity(feature, gameConfig) {
  const provinceName = feature.properties?.shapeName ?? '';
  const starter = INLAND_STARTER_BY_PROVINCE.get(provinceName);
  if (!starter) return null;

  const draft = {
    name: starter.name,
    provinceName: starter.provinceName,
    province: starter.province,
    district: starter.district,
    owner: null,
    population: 0,
    type: 'Küçükşehir',
    tier: 'town',
    status: 'empty',
    lat: starter.lat,
    lng: starter.lng,
    worldRole: WORLD_ROLES.OPEN_INLAND,
    isCoastal: false,
  };
  return enrichMapCityWithWorld(draft, gameConfig);
}

/**
 * GeoJSON parsellerinden dünya/bot ülkelerini üretir.
 * Oyuncu ülkesini atlar; mevcut düşman demo üslerine dokunmaz.
 */
export function seedWorldMapFromProvinces({
  mapCities = [],
  playerCities = [],
  provinces = null,
  gameConfig = DEFAULT_GAME_CONFIG,
} = {}) {
  if (!provinces?.features?.length) {
    return mapCities.map((c) => enrichMapCityWithWorld(c, gameConfig));
  }

  const cfg = normalizeGameConfig(gameConfig);
  const playerProvinces = new Set(
    (playerCities ?? []).map((c) => c.provinceName ?? c.name),
  );
  const next = [...mapCities.map((c) => enrichMapCityWithWorld(c, gameConfig))];
  const byProvince = new Map();
  for (const city of next) {
    const key = city.provinceName ?? city.name;
    if (key) byProvince.set(key, city);
  }

  let changed = false;
  const upsert = (city) => {
    const idx = next.findIndex((c) => c.provinceName === city.provinceName || c.name === city.name);
    if (idx >= 0) next[idx] = city;
    else next.push(city);
    changed = true;
  };

  for (const feature of provinces.features) {
    const provinceName = feature.properties?.shapeName;
    if (!provinceName || playerProvinces.has(provinceName)) continue;

    const worldRole = resolveProvinceWorldRole(provinceName, cfg);
    if (worldRole === WORLD_ROLES.WORLD_EMPTY) continue;

    const existing = byProvince.get(provinceName);
    if (existing?.status === 'enemy') continue;

    if (worldRole === WORLD_ROLES.BOT_COASTAL || worldRole === WORLD_ROLES.BOT_CAPITAL) {
      if (existing?.status === 'own') continue;
      const botCity = createBotWorldCity(feature, worldRole, cfg);
      if (botCity) {
        upsert(botCity);
        byProvince.set(provinceName, botCity);
      }
      continue;
    }

    if (worldRole === WORLD_ROLES.PLAYER_SLOT) {
      if (existing?.status === 'own') continue;
      const slot = createPlayerSlotMapCity(feature, cfg);
      if (slot) {
        upsert(slot);
        byProvince.set(provinceName, slot);
      }
      continue;
    }

    if (worldRole === WORLD_ROLES.OPEN_INLAND && isProvinceOpenForPlayer(provinceName, cfg)) {
      if (existing?.status === 'bot' || existing?.status === 'own') continue;
      const openCity = createOpenInlandMapCity(feature, cfg);
      if (openCity) {
        upsert(openCity);
        byProvince.set(provinceName, openCity);
      }
    }
  }

  return changed ? next : mapCities.map((c) => enrichMapCityWithWorld(c, gameConfig));
}

export function isRaidOnlyMapTarget(mapCity, defenderPlayerCity) {
  if (defenderPlayerCity && isMainHqCity(defenderPlayerCity)) return true;
  if (mapCity?.worldRole === WORLD_ROLES.OPEN_INLAND && mapCity.status === 'own') {
    const pc = defenderPlayerCity;
    if (pc && isMainHqCity(pc)) return true;
  }
  return false;
}

export function isConquerableMapTarget(mapCity, state = null) {
  if (!mapCity) return false;
  if (mapCity.worldRole === WORLD_ROLES.PLAYER_SLOT) return false;
  if (mapCity.status === 'bot') {
    return mapCity.worldRole === WORLD_ROLES.BOT_COASTAL
      || mapCity.worldRole === WORLD_ROLES.BOT_CAPITAL
      || mapCity.worldRole === WORLD_ROLES.MEGA_CITY
      || !mapCity.worldRole;
  }
  if (mapCity.status === 'enemy' && mapCity.owner && state) {
    const defenderPc = findPlayerCityByMapName(state, mapCity.name);
    return Boolean(defenderPc && !isMainHqCity(defenderPc));
  }
  return false;
}

export function findPlayerCityByMapName(state, mapCityName) {
  return state.playerCities?.find((c) => c.name === mapCityName) ?? null;
}

export function buildColonyPlayerCityFromMap(mapEntry, mapCityName) {
  const name = mapCityName ?? mapEntry?.name;
  let cityId = slugCityId(name);
  return {
    id: cityId,
    name,
    province: mapEntry?.province ?? '—',
    provinceName: mapEntry?.provinceName,
    district: mapEntry?.district ?? 'Merkez',
    type: mapEntry?.isCoastal || String(mapEntry?.type ?? '').includes('Kıyı')
      ? 'Kıyı Kolonisi'
      : 'Kolonisi',
    lat: mapEntry?.lat,
    lng: mapEntry?.lng,
    cityRole: PLAYER_CITY_ROLES.COLONY,
    isUnlosable: false,
    isCoastal: Boolean(mapEntry?.isCoastal),
  };
}
