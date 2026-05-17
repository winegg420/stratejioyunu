import L from 'leaflet';
import { CITY_STATUS_COLORS } from './mapUtils';
import { inferCityTier } from './cyberMapConfig';

const TIER_RING = {
  town: { r: 10, stroke: 1.5, inner: 3 },
  metropolis: { r: 14, stroke: 2, inner: 5 },
  capital: { r: 18, stroke: 2.5, inner: 6 },
};

function statusColor(status) {
  return CITY_STATUS_COLORS[status] || CITY_STATUS_COLORS.enemy;
}

export function getCyberMarkerHtml(city, { underAttack = false } = {}) {
  const tier = inferCityTier(city);
  const spec = TIER_RING[tier];
  const color = underAttack ? '#ef4444' : statusColor(city.status);
  const pulse = tier === 'capital' ? 'cyber-marker-ping' : '';
  const attack = underAttack ? 'cyber-marker--attack' : '';

  const tierGlyph =
    tier === 'capital'
      ? '<polygon points="20,8 24,16 32,16 26,21 28,29 20,25 12,29 14,21 8,16 16,16" fill="currentColor" opacity="0.9"/>'
      : tier === 'metropolis'
        ? '<rect x="14" y="14" width="12" height="12" rx="2" fill="currentColor" opacity="0.85"/>'
        : '<circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.9"/>';

  return `
    <div class="cyber-marker ${pulse} ${attack}" style="color:${color}">
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle cx="20" cy="20" r="${spec.r}" fill="none" stroke="currentColor" stroke-width="${spec.stroke}" opacity="0.95"/>
        <circle cx="20" cy="20" r="${spec.r - 4}" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
        <circle cx="20" cy="20" r="${spec.inner}" fill="currentColor" opacity="0.55"/>
        ${tierGlyph}
      </svg>
    </div>
  `;
}

export function createCyberCityIcon(city, options = {}) {
  return L.divIcon({
    className: 'cyber-marker-leaflet',
    html: getCyberMarkerHtml(city, options),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}
