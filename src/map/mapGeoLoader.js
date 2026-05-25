import { MAP_GEO } from './mapGeoConfig';

export function getMapGeoUrl() {
  return MAP_GEO.geoUrl;
}

export async function fetchMapGeo(signal) {
  const res = await fetch(getMapGeoUrl(), { signal });
  if (!res.ok) throw new Error(`geo ${res.status}`);
  return res.json();
}
