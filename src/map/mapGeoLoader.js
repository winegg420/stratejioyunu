import { MAP_GEO } from './mapGeoConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';
import { sanitizeWorldCountriesGeo } from './geoSanitizeWorld';

export function getMapGeoUrl() {
  return MAP_GEO.geoUrl;
}

export async function fetchMapGeo(signal) {
  const res = await fetch(getMapGeoUrl(), { signal });
  if (!res.ok) throw new Error(`geo ${res.status}`);
  const data = await res.json();
  if (IS_WORLD_MAP) {
    return sanitizeWorldCountriesGeo(data);
  }
  return data;
}
