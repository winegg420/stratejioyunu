import L from 'leaflet';
import { CITY_STATUS_COLORS } from './mapUtils';

export const HQ_GREEN = '#22ff88';

const MARKER_PIN_SIZE = 28;
const MARKER_LABEL_WIDTH = 112;

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLabelStack(city, ownerLabel, { cyberActive = false } = {}) {
  const isBot = city.status === 'bot';
  const owner = !isBot && ownerLabel && ownerLabel !== 'Boş' ? ownerLabel : null;
  const botBadge = isBot
    ? '<span class="map-marker-label__bot">BOT</span>'
    : '';
  return `
    <div class="map-marker-label-stack${cyberActive ? ' map-marker-label-stack--cyber' : ''}${isBot ? ' map-marker-label-stack--bot' : ''}">
      ${botBadge}
      <span class="map-marker-label__city">${escapeHtml(city.name)}</span>
      ${owner ? `<span class="map-marker-label__owner">${escapeHtml(owner)}</span>` : ''}
    </div>
  `;
}

function wrapMarker(pinHtml, city, ownerLabel, options = {}) {
  const pinH = options.pinHeight ?? MARKER_PIN_SIZE;
  const showLabels = options.showLabels !== false;
  const hasOwner = ownerLabel && ownerLabel !== 'Boş' && city.status !== 'bot';
  const labelH = showLabels
    ? (city.status === 'bot' ? 22 : (hasOwner ? 30 : 18))
    : 0;
  const totalH = pinH + labelH + (showLabels ? 4 : 0);

  return {
    html: `
      <div class="map-marker-wrap${showLabels ? '' : ' map-marker-wrap--pin-only'}">
        <div class="map-marker-pin">${pinHtml}</div>
        ${showLabels ? buildLabelStack(city, ownerLabel, options) : ''}
      </div>
    `,
    iconSize: [showLabels ? MARKER_LABEL_WIDTH : pinH, totalH],
    iconAnchor: [showLabels ? MARKER_LABEL_WIDTH / 2 : pinH / 2, pinH / 2],
  };
}

/** Aktif üs — radar + etiket */
export function createActiveHqIcon(city, ownerLabel, { showLabels = true } = {}) {
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
    { pinHeight: 30, showLabels },
  );

  return L.divIcon({
    className: 'active-hq-marker map-marker-icon',
    ...wrapped,
  });
}

export function createOwnCityIcon(city, {
  underAttack = false,
  ownerLabel,
  cyberActive = false,
  peaceShield = false,
  showLabels = true,
} = {}) {
  const color = underAttack ? '#ef4444' : peaceShield ? '#4ade80' : HQ_GREEN;
  const peaceRing = peaceShield
    ? '<span class="map-peace-shield-ring" aria-hidden="true"></span>'
    : '';
  const wrapped = wrapMarker(
    `${peaceRing}<span class="own-city-marker__dot" style="background:${color}"></span>`,
    city,
    ownerLabel,
    { pinHeight: 22, cyberActive, showLabels },
  );

  return L.divIcon({
    className: `own-city-marker map-marker-icon${underAttack ? ' own-city-marker--attack' : ''}`,
    ...wrapped,
  });
}

export function createCityMarkerIcon(city, {
  underAttack = false,
  ownerLabel,
  cyberActive = false,
  showLabels = true,
} = {}) {
  const isBot = city.status === 'bot';
  const color = underAttack
    ? '#ef4444'
    : (isBot ? CITY_STATUS_COLORS.bot : (CITY_STATUS_COLORS[city.status] || CITY_STATUS_COLORS.enemy));
  const size = MARKER_PIN_SIZE;
  const opacity = isBot ? 0.72 : 0.9;

  const wrapped = wrapMarker(
    `
      <svg viewBox="0 0 32 32" width="${size}" height="${size}" style="color:${color};opacity:${opacity}">
        <circle cx="16" cy="16" r="3.5" fill="currentColor"/>
        <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.5"/>
      </svg>
    `,
    city,
    ownerLabel,
    { pinHeight: size, cyberActive, showLabels },
  );

  return L.divIcon({
    className: `map-city-marker map-marker-icon${underAttack ? ' map-city-marker--attack' : ''}${isBot ? ' map-city-marker--bot' : ''}`,
    ...wrapped,
  });
}
