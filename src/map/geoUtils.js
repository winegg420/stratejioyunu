import { TURKEY_BOUNDS, clampLatLng } from './turkeyBounds';

export function toPercent(lat, lng) {
  const c = clampLatLng(lat, lng);
  const x = ((c.lng - TURKEY_BOUNDS.west) / (TURKEY_BOUNDS.east - TURKEY_BOUNDS.west)) * 100;
  const y = ((TURKEY_BOUNDS.north - c.lat) / (TURKEY_BOUNDS.north - TURKEY_BOUNDS.south)) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

export function ringToPoints(ring) {
  return ring
    .map(([lng, lat]) => {
      const { x, y } = toPercent(lat, lng);
      return `${x},${y}`;
    })
    .join(' ');
}

export function featureToPolygons(feature) {
  const { type, coordinates } = feature.geometry;
  if (type === 'Polygon') return [coordinates[0]];
  if (type === 'MultiPolygon') return coordinates.map((poly) => poly[0]);
  return [];
}

export function getFeatureCentroid(feature) {
  const rings = featureToPolygons(feature);
  if (!rings.length) return { lat: 39, lng: 35 };

  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      sumLat += lat;
      sumLng += lng;
      count += 1;
    }
  }

  if (!count) return { lat: 39, lng: 35 };
  return { lat: sumLat / count, lng: sumLng / count };
}

export function getFeatureBounds(feature) {
  const rings = featureToPolygons(feature);
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }

  return { minLat, maxLat, minLng, maxLng };
}

export function featureToViewBoxPolygons(feature, bounds) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const pad = 0.08;

  return featureToPolygons(feature).map((ring) =>
    ring
      .map(([lng, lat]) => {
        const x = ((lng - minLng) / lngSpan) * (1 - 2 * pad) * 100 + pad * 100;
        const y = ((maxLat - lat) / latSpan) * (1 - 2 * pad) * 100 + pad * 100;
        return `${x},${y}`;
      })
      .join(' '),
  );
}
