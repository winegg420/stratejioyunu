/** GeoJSON — dünya katmanından Antarktika / aşırı güney kutbu poligonları ayıklama */

function walkCoords(coords, visitor) {
  if (!coords?.length) return;
  if (typeof coords[0] === 'number') {
    visitor(coords);
    return;
  }
  for (const c of coords) walkCoords(c, visitor);
}

function featureMinLatitude(geometry) {
  let minLat = 90;
  if (!geometry) return minLat;
  const visitor = ([, lat]) => {
    if (typeof lat === 'number' && !Number.isNaN(lat)) {
      minLat = Math.min(minLat, lat);
    }
  };
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => walkCoords(ring, visitor));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly) => poly.forEach((ring) => walkCoords(ring, visitor)));
  }
  return minLat;
}

export function sanitizeWorldCountriesGeo(fc) {
  if (!fc?.features?.length) return fc;
  const next = fc.features.filter((f) => {
    const iso = String(f.properties?.shapeISO ?? '').trim().toUpperCase();
    const name = `${f.properties?.shapeName ?? ''} ${f.properties?.admin ?? ''}`;
    if (iso === 'AQ') return false;
    if (/antarctic/i.test(name) || /antarkt/i.test(name)) return false;
    const minLat = featureMinLatitude(f.geometry);
    if (minLat < -62) return false;
    return true;
  });
  return next.length === fc.features.length ? fc : { ...fc, features: next };
}
