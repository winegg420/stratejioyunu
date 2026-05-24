import { resolveCityProvinceName } from './cityProvinceMatch';

function pointInRing(point, ring) {
  if (!ring?.length) return false;
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi + 0) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(point, feature) {
  const geom = feature?.geometry;
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    return pointInRing(point, geom.coordinates[0]);
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some((poly) => pointInRing(point, poly[0]));
  }
  return false;
}

/** Tıklanan koordinattaki il poligonu */
export function findProvinceAtLatLng(provinces, latlng) {
  if (!provinces?.features?.length || latlng == null) return null;
  const point = [latlng.lng, latlng.lat];
  for (const feature of provinces.features) {
    if (pointInFeature(point, feature)) return feature;
  }
  return null;
}

/** İl poligonu için harita şehri veya boş hedef */
export function findCityForProvinceFeature(feature, mapCities, playerCities) {
  const provinceName = feature?.properties?.shapeName;
  if (!provinceName || !Array.isArray(mapCities)) return null;

  const norm = (s) => String(s ?? '').trim().toLocaleLowerCase('tr');
  const target = norm(provinceName);

  return mapCities.find((c) => {
    const pn = resolveCityProvinceName(c, playerCities);
    return norm(pn) === target || norm(c.name) === target || norm(c.provinceName) === target;
  }) ?? mapCities.find((c) => c.name === provinceName) ?? null;
}

export function buildMapTargetFromProvince(feature, latlng, mapCities, playerCities) {
  const provinceName = feature?.properties?.shapeName ?? 'Bölge';
  const city = findCityForProvinceFeature(feature, mapCities, playerCities);
  if (city) return city;

  return {
    name: provinceName,
    provinceName,
    province: feature?.properties?.shapeISO,
    lat: latlng?.lat,
    lng: latlng?.lng,
    status: 'empty',
  };
}
