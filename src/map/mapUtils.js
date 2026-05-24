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
};

export function getMapCityDisplayColor(city, options = {}) {
  if (!city) return CITY_STATUS_COLORS.empty;
  const { ideologyView = false, playerName, playerIdeology } = options;
  if (ideologyView && playerName) {
    const ideology = resolveCityIdeology(city, playerName, playerIdeology);
    const profile = getIdeologyProfile(ideology);
    if (profile?.color) return profile.color;
  }
  if (city.status === 'own') return CITY_STATUS_COLORS.own;
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
  return {
    ...base,
    fillOpacity: Math.min(0.14, (base.fillOpacity || 0.06) + 0.06),
    weight: 1.6,
    color: 'rgba(0, 240, 255, 0.55)',
  };
}
