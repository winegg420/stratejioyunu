import L from 'leaflet';
import { CITY_STATUS_COLORS } from './mapUtils';
import { inferCityTier } from './cyberMapConfig';

export const HQ_GREEN = '#22ff88';

/** Aktif üs — className doğrudan Leaflet divIcon üzerinde (CSS kesin uygulansın). */
export function createActiveHqIcon() {
  return L.divIcon({
    className: 'active-hq-marker',
    html: `
      <span class="active-hq-radar" aria-hidden="true">
        <span class="active-hq-radar__ring active-hq-radar__ring--1"></span>
        <span class="active-hq-radar__ring active-hq-radar__ring--2"></span>
        <span class="active-hq-radar__ring active-hq-radar__ring--3"></span>
      </span>
      <span class="active-hq-marker__glyph" aria-hidden="true">★</span>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

export function createOwnCityIcon(city, { underAttack = false } = {}) {
  const color = underAttack ? '#ef4444' : HQ_GREEN;
  return L.divIcon({
    className: `own-city-marker${underAttack ? ' own-city-marker--attack' : ''}`,
    html: `<span class="own-city-marker__dot" style="background:${color}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function createCityMarkerIcon(city, { underAttack = false } = {}) {
  const tier = inferCityTier(city);
  const color = underAttack ? '#ef4444' : (CITY_STATUS_COLORS[city.status] || CITY_STATUS_COLORS.enemy);
  const size = tier === 'capital' ? 36 : tier === 'metropolis' ? 32 : 28;
  const anchor = size / 2;

  return L.divIcon({
    className: 'map-city-marker',
    html: `
      <svg viewBox="0 0 32 32" width="${size}" height="${size}" style="color:${color}">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9"/>
        <circle cx="16" cy="16" r="4" fill="currentColor"/>
      </svg>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
  });
}
