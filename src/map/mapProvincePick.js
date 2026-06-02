import { resolveCityProvinceName } from './cityProvinceMatch';
import { getFeatureBounds } from './geoUtils';

function normTr(s) {
  return String(s ?? '').trim().toLocaleLowerCase('tr');
}

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

function pointInBbox(point, bbox) {
  const [lng, lat] = point;
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

/** @type {WeakMap<object, Array<{ feature: object, bbox: object }>>} */
const indexCache = new WeakMap();

function getProvinceIndex(provinces) {
  if (!provinces?.features?.length) return [];
  const cached = indexCache.get(provinces);
  if (cached) return cached;

  const index = provinces.features.map((feature) => ({
    feature,
    bbox: getFeatureBounds(feature),
  }));
  indexCache.set(provinces, index);
  return index;
}

/** Tıklanan koordinattaki il/ülke poligonu */
export function findProvinceAtLatLng(provinces, latlng) {
  if (!provinces?.features?.length || latlng == null) return null;
  const point = [latlng.lng, latlng.lat];
  const index = getProvinceIndex(provinces);

  for (const { feature, bbox } of index) {
    if (!pointInBbox(point, bbox)) continue;
    if (pointInFeature(point, feature)) return feature;
  }
  return null;
}

/** İl poligonu için harita şehri veya boş hedef */
export function findCityForProvinceFeature(feature, mapCities, playerCities) {
  const provinceName = feature?.properties?.shapeName;
  if (!provinceName || !Array.isArray(mapCities)) return null;

  const target = normTr(provinceName);

  const matches = mapCities.filter((c) => {
    const pn = resolveCityProvinceName(c, playerCities);
    return normTr(pn) === target || normTr(c.name) === target || normTr(c.provinceName) === target;
  });
  if (!matches.length) {
    return mapCities.find((c) => c.name === provinceName) ?? null;
  }
  const own = matches.find((c) => c.status === 'own');
  if (own) return own;
  const playerCity = matches.find((c) => playerCities?.some((p) => p.name === c.name));
  return playerCity ?? matches[0];
}

export function buildMapTargetFromProvince(feature, latlng, mapCities, playerCities, ownProvinceNames = null) {
  const provinceName = feature?.properties?.shapeName ?? 'Bölge';
  const city = findCityForProvinceFeature(feature, mapCities, playerCities);
  if (city) return city;

  if (ownProvinceNames?.has?.(provinceName)) {
    const pc = (playerCities ?? []).find((p) => {
      const pn = resolveCityProvinceName(p, playerCities);
      return pn === provinceName || p.provinceName === provinceName;
    });
    if (pc) {
      return {
        name: pc.name,
        provinceName: pc.provinceName ?? provinceName,
        province: feature?.properties?.shapeISO ?? pc.province,
        lat: pc.lat ?? latlng?.lat,
        lng: pc.lng ?? latlng?.lng,
        status: 'own',
      };
    }
  }

  return {
    name: provinceName,
    provinceName,
    province: feature?.properties?.shapeISO,
    lat: latlng?.lat,
    lng: latlng?.lng,
    status: 'empty',
  };
}
