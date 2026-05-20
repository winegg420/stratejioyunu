import L from 'leaflet';
import { CITY_STATUS_COLORS } from './mapUtils';
import { inferCityTier } from './cyberMapConfig';

export const HQ_GREEN = '#22ff88';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLabelStack(city, ownerLabel, { cyberActive = false } = {}) {
  const owner = ownerLabel && ownerLabel !== 'Boş' ? ownerLabel : null;
  return `
    <div class="map-marker-label-stack${cyberActive ? ' map-marker-label-stack--cyber' : ''}">
      <span class="map-marker-label__city">${escapeHtml(city.name)}</span>
      ${owner ? `<span class="map-marker-label__owner">${escapeHtml(owner)}</span>` : ''}
    </div>
  `;
}

function wrapMarker(pinHtml, city, ownerLabel, options = {}) {
  const tier = inferCityTier(city);
  const width = tier === 'capital' ? 132 : tier === 'metropolis' ? 124 : 116;
  const pinH = options.pinHeight ?? 28;
  const labelH = ownerLabel && ownerLabel !== 'Boş' ? 30 : 18;
  const totalH = pinH + labelH + 4;

  return {
    html: `
      <div class="map-marker-wrap">
        <div class="map-marker-pin">${pinHtml}</div>
        ${buildLabelStack(city, ownerLabel, options)}
      </div>
    `,
    iconSize: [width, totalH],
    iconAnchor: [width / 2, pinH / 2],
  };
}

/** Aktif üs — radar + etiket */
export function createActiveHqIcon(city, ownerLabel) {
  const wrapped = wrapMarker(
    `
      <span class="active-hq-radar" aria-hidden="true">
        <span class="active-hq-radar__ring active-hq-radar__ring--1"></span>
        <span class="active-hq-radar__ring active-hq-radar__ring--2"></span>
        <span class="active-hq-radar__ring active-hq-radar__ring--3"></span>
      </span>
      <span class="active-hq-marker__glyph" aria-hidden="true">★</span>
    `,
    city,
    ownerLabel,
    { pinHeight: 32 },
  );

  return L.divIcon({
    className: 'active-hq-marker map-marker-icon',
    ...wrapped,
  });
}

export function createOwnCityIcon(city, { underAttack = false, ownerLabel, cyberActive = false } = {}) {
  const color = underAttack ? '#ef4444' : HQ_GREEN;
  const wrapped = wrapMarker(
    `<span class="own-city-marker__dot" style="background:${color}"></span>`,
    city,
    ownerLabel,
    { pinHeight: 22, cyberActive },
  );

  return L.divIcon({
    className: `own-city-marker map-marker-icon${underAttack ? ' own-city-marker--attack' : ''}`,
    ...wrapped,
  });
}

export function createCityMarkerIcon(city, { underAttack = false, ownerLabel, cyberActive = false } = {}) {
  const tier = inferCityTier(city);
  const color = underAttack ? '#ef4444' : (CITY_STATUS_COLORS[city.status] || CITY_STATUS_COLORS.enemy);
  const size = tier === 'capital' ? 36 : tier === 'metropolis' ? 32 : 28;

  const wrapped = wrapMarker(
    `
      <svg viewBox="0 0 32 32" width="${size}" height="${size}" style="color:${color}">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9"/>
        <circle cx="16" cy="16" r="4" fill="currentColor"/>
      </svg>
    `,
    city,
    ownerLabel,
    { pinHeight: size, cyberActive },
  );

  return L.divIcon({
    className: `map-city-marker map-marker-icon${underAttack ? ' map-city-marker--attack' : ''}`,
    ...wrapped,
  });
}
