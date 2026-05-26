import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { getFeatureBounds, getFeatureCentroid } from './geoUtils';
import { MAP_COUNTRY_LABEL_MIN, MAP_ZOOM_MARKER_MIN } from './mapZoomConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';
import { filterMapPointsInViewport } from './mapViewportCull';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Küçük ülkeler — kısa etiket (kutu taşmasını azaltır) */
const MICRO_LABEL_ABBREV = {
  Lüksemburg: 'LUX',
  Luxembourg: 'LUX',
  Kosova: 'KOS',
  Kosovo: 'KOS',
  Kıbrıs: 'Kıbrıs',
  Cyprus: 'Kıbrıs',
  'Kuzey Kıbrıs': 'K.Kıbrıs',
  'Northern Cyprus': 'K.Kıbrıs',
  Malta: 'MLT',
  'Brunei Darussalam': 'BRN',
  Brunei: 'BRN',
  Singapur: 'SGP',
  Singapore: 'SGP',
  Monako: 'MCO',
  Monaco: 'MCO',
  'San Marino': 'SMR',
  'Vatican City': 'VAT',
  Andorra: 'AND',
  Liechtenstein: 'LIE',
  Bahreyn: 'BHR',
  Bahrain: 'BHR',
  Katar: 'QAT',
  Qatar: 'QAT',
};

function featureAreaDeg2(feature) {
  const b = getFeatureBounds(feature);
  const latSpan = Math.max(0, b.maxLat - b.minLat);
  const lngSpan = Math.max(0, b.maxLng - b.minLng);
  return latSpan * lngSpan;
}

function labelAnchorCenter(feature) {
  const b = getFeatureBounds(feature);
  return {
    lat: (b.minLat + b.maxLat) / 2,
    lng: (b.minLng + b.maxLng) / 2,
  };
}

function labelIconSize(displayName, { compact = false, micro = false } = {}) {
  const charW = micro ? 4.5 : compact ? 5 : 6;
  const pad = micro ? 10 : compact ? 14 : 18;
  const maxW = micro ? 52 : compact ? 96 : 132;
  const minW = micro ? 28 : compact ? 40 : 52;
  const width = Math.min(maxW, Math.max(minW, displayName.length * charW + pad));
  const height = micro ? 12 : compact ? 14 : 18;
  return { width, height };
}

function createCountryLabelIcon(displayName, { compact = false, micro = false, opacity = 1 } = {}) {
  const { width, height } = labelIconSize(displayName, { compact, micro });
  const fade = Math.max(0, Math.min(1, opacity));

  return L.divIcon({
    className: [
      'map-country-centroid-label',
      compact && 'map-country-centroid-label--compact',
      micro && 'map-country-centroid-label--micro',
      fade < 0.98 && 'map-country-centroid-label--fading',
    ].filter(Boolean).join(' '),
    html: [
      `<div class="map-country-centroid-label__inner" style="opacity:${fade.toFixed(2)}">`,
      `<span class="map-country-centroid-label__name">${escapeHtml(displayName)}</span>`,
      '</div>',
    ].join(''),
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  });
}

function maxCountryLabelsForZoom(zoom) {
  if (zoom >= 4.75) return 26;
  if (zoom >= 4) return 34;
  if (zoom >= 3) return 22;
  return 16;
}

/** Yakın zoom'da etiket çakışmasını azalt */
function minLabelSeparationDeg(zoom) {
  if (zoom >= 4.75) return 1.35;
  if (zoom >= 4) return 2.1;
  return 3.2;
}

function filterByCollision(points, zoom, max) {
  const minSep = minLabelSeparationDeg(zoom);
  const sorted = [...points].sort((a, b) => b.area - a.area);
  const kept = [];

  for (const p of sorted) {
    const clash = kept.some((k) => {
      const dLat = p.lat - k.lat;
      const dLng = p.lng - k.lng;
      return Math.hypot(dLat, dLng) < minSep;
    });
    if (!clash) kept.push(p);
    if (kept.length >= max) break;
  }

  return kept;
}

function pickDisplayName(canonicalName, countryLabel) {
  const full = countryLabel(canonicalName);
  const abbrev = MICRO_LABEL_ABBREV[canonicalName] ?? MICRO_LABEL_ABBREV[full];
  return abbrev ?? full;
}

/** Zoom bandında yumuşak görünürlük (ani pop azaltır) */
function countryLabelOpacity(zoom) {
  const min = MAP_COUNTRY_LABEL_MIN;
  const max = MAP_ZOOM_MARKER_MIN;
  if (zoom < min - 0.35 || zoom >= max + 0.2) return 0;
  const fadeIn = Math.min(1, Math.max(0, (zoom - (min - 0.25)) / 0.35));
  const fadeOut = zoom < max
    ? Math.min(1, Math.max(0, (max - zoom) / 0.35))
    : Math.min(1, Math.max(0, (max + 0.2 - zoom) / 0.2));
  return fadeIn * fadeOut;
}

/** Dünya haritası — GeoJSON ülke adları (zoom ile görünür) */
export default function WorldCountryLabelsLayer({ provinces, zoom = 0, viewportBounds = null }) {
  const { countryLabel } = useLanguage();
  const compact = zoom < 4.25;
  const labelOpacity = countryLabelOpacity(zoom);
  const show = IS_WORLD_MAP && labelOpacity > 0.04;

  const points = useMemo(() => {
    if (!provinces?.features?.length || !show) return [];

    const raw = provinces.features
      .map((feature) => {
        const name = feature.properties?.shapeName;
        if (!name) return null;
        const area = featureAreaDeg2(feature);
        const center = area < 55 ? labelAnchorCenter(feature) : getFeatureCentroid(feature);
        const micro = area < 12;
        const displayName = micro || area < 55
          ? pickDisplayName(name, countryLabel)
          : countryLabel(name);

        return {
          name,
          lat: center.lat,
          lng: center.lng,
          area,
          micro,
          displayName,
        };
      })
      .filter(Boolean);

    const inView = filterMapPointsInViewport(raw, viewportBounds, {
      max: raw.length,
      paddingDeg: 4,
    });
    const capped = filterByCollision(inView, zoom, maxCountryLabelsForZoom(zoom));
    return capped;
  }, [provinces, zoom, viewportBounds, countryLabel, show]);

  if (!show || !points.length) return null;

  return (
    <>
      {points.map((point) => (
        <Marker
          key={`country-label-${point.name}`}
          position={[point.lat, point.lng]}
          icon={createCountryLabelIcon(point.displayName, {
            compact,
            micro: point.micro,
            opacity: labelOpacity,
          })}
          interactive={false}
          zIndexOffset={900}
        />
      ))}
    </>
  );
}
