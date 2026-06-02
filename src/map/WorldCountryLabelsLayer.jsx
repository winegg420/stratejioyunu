import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { isLargeCountryForMapLabel } from '../lib/worldCountryPopulation';
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

function createCountryLabelIcon(displayName, { compact = false, micro = false, zoomOutTiny = false, opacity = 1 } = {}) {
  const { width, height } = labelIconSize(displayName, { compact, micro });
  const fade = Math.max(0, Math.min(1, opacity));

  return L.divIcon({
    className: [
      'map-country-centroid-label',
      compact && 'map-country-centroid-label--compact',
      micro && 'map-country-centroid-label--micro',
      zoomOutTiny && 'map-country-centroid-label--zoomout-tiny',
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

function maxCountryLabelsForZoom(zoom, { isFullscreen = false } = {}) {
  let cap;
  if (zoom >= 4.75) cap = 26;
  else if (zoom >= 4) cap = 34;
  else if (zoom >= 3) cap = 22;
  else cap = 16;
  if (isFullscreen && zoom < 4) {
    return Math.max(6, Math.round(cap * 0.55));
  }
  return cap;
}

/** Yakın zoom'da etiket çakışmasını azalt */
function minLabelSeparationDeg(zoom, { isFullscreen = false } = {}) {
  let d;
  if (zoom >= 4.75) d = 1.35;
  else if (zoom >= 4) d = 2.1;
  else d = 3.2;
  if (isFullscreen && zoom < 4) return d * 1.45;
  return d;
}

function filterByCollision(points, zoom, max, collisionOpts) {
  const minSep = minLabelSeparationDeg(zoom, collisionOpts);
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

/** Ekran pikseli — zoomend sonrası üst üste binen etiketleri gizle */
function filterLabelsByPixelCollision(map, points, { max, compact, micro: defaultMicro, zoomOutTiny }) {
  if (!map || !points.length) return [];
  const sorted = [...points].sort((a, b) => b.area - a.area);
  const kept = [];
  const boxes = [];

  for (const p of sorted) {
    const pt = map.latLngToContainerPoint([p.lat, p.lng]);
    const micro = p.micro ?? defaultMicro;
    const { width, height } = labelIconSize(p.displayName, { compact, micro });
    const pad = zoomOutTiny ? 2 : 4;
    const box = {
      left: pt.x - width / 2 - pad,
      top: pt.y - height / 2 - pad,
      right: pt.x + width / 2 + pad,
      bottom: pt.y + height / 2 + pad,
    };
    const clash = boxes.some(
      (b) => !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom),
    );
    if (!clash) {
      kept.push(p);
      boxes.push(box);
    }
    if (kept.length >= max) break;
  }

  return kept;
}

function visibleLabelsSignature(list) {
  if (!list?.length) return '';
  return list.map((p) => p.name).join('\u0001');
}

function CountryLabelMarkers({
  points,
  compact,
  zoomOutTiny,
  labelOpacity,
  isFullscreen,
  zoom,
}) {
  const map = useMap();
  const [visible, setVisible] = useState(points);
  const pointsRef = useRef(points);
  const visibleSigRef = useRef(visibleLabelsSignature(points));
  pointsRef.current = points;
  const max = maxCountryLabelsForZoom(zoom, { isFullscreen });

  const applyCollision = useCallback(() => {
    const currentPoints = pointsRef.current;
    if (!map || !currentPoints.length) {
      if (visibleSigRef.current !== '') {
        visibleSigRef.current = '';
        setVisible([]);
      }
      return;
    }
    const pixelFiltered = filterLabelsByPixelCollision(map, currentPoints, {
      max,
      compact,
      zoomOutTiny,
    });
    const next = pixelFiltered.length
      ? pixelFiltered
      : filterByCollision(currentPoints, zoom, max, { isFullscreen });
    const sig = visibleLabelsSignature(next);
    if (sig === visibleSigRef.current) return;
    visibleSigRef.current = sig;
    setVisible(next);
  }, [map, max, compact, zoomOutTiny, zoom, isFullscreen]);

  useMapEvents({
    zoomend: applyCollision,
    moveend: applyCollision,
  });

  useEffect(() => {
    applyCollision();
  }, [applyCollision, points]);

  if (!visible.length) return null;

  return (
    <>
      {visible.map((point) => (
        <Marker
          key={`country-label-${point.name}`}
          position={[point.lat, point.lng]}
          icon={createCountryLabelIcon(point.displayName, {
            compact,
            micro: point.micro,
            zoomOutTiny,
            opacity: labelOpacity,
          })}
          interactive={false}
          zIndexOffset={900}
        />
      ))}
    </>
  );
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
export default function WorldCountryLabelsLayer({
  provinces,
  zoom = 0,
  viewportBounds = null,
  isFullscreen = false,
}) {
  const { countryLabel } = useLanguage();
  const compact = zoom < 4.25;
  const labelOpacity = countryLabelOpacity(zoom);
  const show = IS_WORLD_MAP && labelOpacity > 0.04;
  const zoomOutTiny = isFullscreen && zoom < 4;

  const points = useMemo(() => {
    if (!provinces?.features?.length || !show) return [];
    const collisionOpts = { isFullscreen };

    const raw = provinces.features
      .map((feature) => {
        const name = feature.properties?.shapeName;
        if (!name) return null;
        if (zoom < 3 && !isLargeCountryForMapLabel(name, feature.properties?.shapeISO)) {
          return null;
        }
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
    const cap = maxCountryLabelsForZoom(zoom, collisionOpts) * 2;
    if (inView.length <= cap) return inView;
    return [...inView].sort((a, b) => b.area - a.area).slice(0, cap);
  }, [provinces, zoom, viewportBounds, countryLabel, show, isFullscreen]);

  if (!show || !points.length) return null;

  return (
    <CountryLabelMarkers
      points={points}
      compact={compact}
      zoomOutTiny={zoomOutTiny}
      labelOpacity={labelOpacity}
      isFullscreen={isFullscreen}
      zoom={zoom}
    />
  );
}

