import L from 'leaflet';
import { getMapCityDisplayName } from './mapCityDisplayName';
import { PLAYER_CITY_ROLES } from '../data/worldCitiesCatalog';
import { CITY_STATUS_COLORS } from './mapUtils';

/** Tüm imparatorluk şehirleri — aynı neon yeşil parıltı */
export const HQ_GREEN = '#22ff88';
export const EMPIRE_CITY_GLOW = HQ_GREEN;
export const BOT_MARKER_ORANGE = '#f97316';

const MARKER_PIN_SIZE = 16;
const MARKER_LABEL_WIDTH = 68;

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLabelStack(city, ownerLabel, { cyberActive = false } = {}) {
  const isBot = city.status === 'bot';
  const owner = !isBot && ownerLabel ? ownerLabel : null;
  const displayName = getMapCityDisplayName(city.name);
  return `
    <div class="map-marker-label-stack${cyberActive ? ' map-marker-label-stack--cyber' : ''}${isBot ? ' map-marker-label-stack--bot' : ''}">
      <span class="map-marker-label__city">${escapeHtml(displayName)}</span>
      ${owner ? `<span class="map-marker-label__owner">${escapeHtml(owner)}</span>` : ''}
    </div>
  `;
}

function wrapMarker(pinHtml, city, ownerLabel, options = {}) {
  const pinH = options.pinHeight ?? MARKER_PIN_SIZE;
  const showLabels = options.showLabels !== false;
  const hasOwner = ownerLabel && city.status !== 'bot';
  const labelH = showLabels ? (hasOwner ? 22 : 14) : 0;
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

/** Ana Merkez — parlak yeşil yıldız (aktif veya pasif) */
export function createMainHqIcon(city, ownerLabel, { showLabels = true, isActive = false } = {}) {
  const wrapped = wrapMarker(
    `
      <span class="active-hq-radar main-hq-radar" aria-hidden="true">
        <span class="active-hq-radar__ring active-hq-radar__ring--1"></span>
        <span class="active-hq-radar__ring active-hq-radar__ring--2"></span>
        <span class="active-hq-radar__ring active-hq-radar__ring--3"></span>
      </span>
      <span class="main-hq-marker__glyph" aria-hidden="true">★</span>
    `,
    city,
    ownerLabel,
    { pinHeight: 20, showLabels },
  );

  return L.divIcon({
    className: [
      'main-hq-marker',
      'active-hq-marker',
      'map-marker-icon',
      isActive ? 'main-hq-marker--active' : '',
    ].filter(Boolean).join(' '),
    ...wrapped,
  });
}

/** Koloni — aynı imparatorluk yeşili, ◆ ikon */
export function createColonyIcon(city, {
  underAttack = false,
  ownerLabel,
  cyberActive = false,
  peaceShield = false,
  showLabels = true,
  isActive = false,
} = {}) {
  const color = underAttack ? '#ef4444' : EMPIRE_CITY_GLOW;
  const peaceRing = peaceShield
    ? '<span class="map-peace-shield-ring" aria-hidden="true"></span>'
    : '';
  const wrapped = wrapMarker(
    `
      <span class="own-city-pulsar colony-pulsar" aria-hidden="true">
        <span class="own-city-pulsar__ring own-city-pulsar__ring--1"></span>
        <span class="own-city-pulsar__ring own-city-pulsar__ring--2"></span>
      </span>
      ${peaceRing}
      <span class="colony-marker__glyph" style="color:${color}" aria-hidden="true">◆</span>
    `,
    city,
    ownerLabel,
    { pinHeight: 16, cyberActive, showLabels },
  );

  return L.divIcon({
    className: [
      'colony-marker',
      'own-city-marker--empire',
      'map-marker-icon',
      isActive ? 'colony-marker--active' : '',
      underAttack ? 'own-city-marker--attack' : '',
    ].filter(Boolean).join(' '),
    ...wrapped,
  });
}

/** Aktif üs — radar + etiket (geriye uyumluluk) */
export function createActiveHqIcon(city, ownerLabel, { showLabels = true } = {}) {
  return createMainHqIcon(city, ownerLabel, { showLabels, isActive: true });
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
    { pinHeight: 20, showLabels },
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
  const color = underAttack ? '#ef4444' : EMPIRE_CITY_GLOW;
  const peaceRing = peaceShield
    ? '<span class="map-peace-shield-ring" aria-hidden="true"></span>'
    : '';
  const wrapped = wrapMarker(
    `
      <span class="own-city-pulsar" aria-hidden="true">
        <span class="own-city-pulsar__ring own-city-pulsar__ring--1"></span>
        <span class="own-city-pulsar__ring own-city-pulsar__ring--2"></span>
        <span class="own-city-pulsar__ring own-city-pulsar__ring--3"></span>
      </span>
      ${peaceRing}
      <span class="own-city-marker__dot" style="background:${color}"></span>
    `,
    city,
    ownerLabel,
    { pinHeight: 14, cyberActive, showLabels },
  );

  return L.divIcon({
    className: [
      'own-city-marker',
      'own-city-marker--empire',
      'map-marker-icon',
      underAttack ? 'own-city-marker--attack' : '',
      peaceShield ? 'own-city-marker--peace' : '',
    ].filter(Boolean).join(' '),
    ...wrapped,
  });
}

/** Düşman/boş şehirler — tıklama alanı; görsel CityTargetReticleLayer'da */
export function createMapHitIcon() {
  return L.divIcon({
    className: 'map-city-hit-marker',
    html: '<span class="map-city-hit-marker__zone" aria-hidden="true"></span>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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
    : (isBot ? BOT_MARKER_ORANGE : (CITY_STATUS_COLORS[city.status] || CITY_STATUS_COLORS.enemy));
  const size = MARKER_PIN_SIZE;
  const opacity = isBot ? 0.42 : 0.9;

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
