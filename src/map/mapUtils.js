import { WORLD_ROLES } from '../data/worldCitiesCatalog';
import { getIdeologyProfile, resolveCityIdeology } from '../lib/ideologySystem';

export const CITY_STATUS_COLORS = {
  own: '#22ff88',
  enemy: '#ef4444',
  empty: '#64748b',
  vassal: '#eab308',
  bot: '#94a3b8',
  siege: '#f97316',
};

/** Bot kıyı / başkent ve açık iç Anadolu — harita lejantı */
export const WORLD_ROLE_COLORS = {
  [WORLD_ROLES.BOT_COASTAL]: '#fbbf24',
  [WORLD_ROLES.BOT_CAPITAL]: '#f59e0b',
  [WORLD_ROLES.OPEN_INLAND]: '#4ade80',
  [WORLD_ROLES.WORLD_EMPTY]: '#64748b',
  [WORLD_ROLES.MEGA_CITY]: '#a78bfa',
  [WORLD_ROLES.PLAYER_SLOT]: '#38bdf8',
};

/** Diğer oyuncu ülkeleri — isimden sabit renk (yeşil/bot sarısından ayrılır) */
export function hashOwnerColor(owner) {
  const key = String(owner ?? '').trim();
  if (!key) return CITY_STATUS_COLORS.enemy;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  const hue = 205 + (h % 95);
  return `hsl(${hue}, 68%, 52%)`;
}

export function isForeignPlayerCity(city, playerName) {
  if (!city) return false;
  if (city.isOwn || city.status === 'own') return false;
  const owner = String(city.owner ?? '').trim();
  if (!owner || city.status !== 'enemy') return false;
  const self = String(playerName ?? '').trim();
  return !self || owner !== self;
}

export function getForeignPlayerProvinceStyle(owner) {
  const fill = hashOwnerColor(owner);
  return {
    fillColor: fill,
    fillOpacity: 0.22,
    color: fill,
    weight: 2.2,
    lineJoin: 'round',
    lineCap: 'round',
    opacity: 0.9,
  };
}

export function getMapCityDisplayColor(city, options = {}) {
  if (!city) return CITY_STATUS_COLORS.empty;
  const { ideologyView = false, playerName, playerIdeology } = options;
  if (city.status === 'own' || city.isOwn) return CITY_STATUS_COLORS.own;
  if (isForeignPlayerCity(city, playerName)) return hashOwnerColor(city.owner);
  if (ideologyView && playerName) {
    const ideology = resolveCityIdeology(city, playerName, playerIdeology);
    const profile = getIdeologyProfile(ideology);
    if (profile?.color) return profile.color;
  }
  if (city.worldRole && WORLD_ROLE_COLORS[city.worldRole]) {
    return WORLD_ROLE_COLORS[city.worldRole];
  }
  if (city.status === 'bot') return WORLD_ROLE_COLORS[WORLD_ROLES.BOT_COASTAL];
  return CITY_STATUS_COLORS[city.status] ?? CITY_STATUS_COLORS.enemy;
}

export function getCityMarkerStyle(status) {
  if (status === 'own') {
    return {
      color: '#ecfeff',
      weight: 2.5,
      fillColor: '#2dd4bf',
      fillOpacity: 1,
      radius: 10,
    };
  }
  if (status === 'empty') {
    return {
      color: '#475569',
      weight: 1,
      fillColor: '#64748b',
      fillOpacity: 0.55,
      radius: 6,
    };
  }
  return {
    color: '#fff',
    weight: 1,
    fillColor: CITY_STATUS_COLORS[status] || CITY_STATUS_COLORS.enemy,
    fillOpacity: 0.9,
    radius: 8,
  };
}

export const MAP_BORDER_STYLE = {
  color: 'rgba(0, 240, 255, 0.4)',
  weight: 1.2,
  lineJoin: 'round',
  lineCap: 'round',
};

/** Oyuncunun kendi ili — her zaman neon yeşil sınır + iç dolgu */
export function getOwnProvinceStyle() {
  return {
    fillColor: '#22ff88',
    fillOpacity: 0.16,
    color: '#22ff88',
    weight: 2.4,
    lineJoin: 'round',
    lineCap: 'round',
    opacity: 0.92,
  };
}

export function getProvinceStyle() {
  return {
    fillColor: '#0a0f0a',
    fillOpacity: 0.06,
    color: 'rgba(0, 240, 255, 0.4)',
    weight: 1.2,
    lineJoin: 'round',
    lineCap: 'round',
    opacity: 0.75,
  };
}


export function getDistrictStyle() {
  return {
    fillColor: '#111a11',
    fillOpacity: 0.62,
    ...MAP_BORDER_STYLE,
  };
}

export function getHoverStyle(base) {
  const isOwn = base?.color === '#22ff88' || base?.fillColor === '#22ff88';
  return {
    ...base,
    fillOpacity: Math.min(isOwn ? 0.24 : 0.14, (base.fillOpacity || 0.06) + 0.06),
    weight: (base.weight || 1.2) + 0.35,
    color: isOwn ? '#4ade80' : 'rgba(0, 240, 255, 0.55)',
  };
}
