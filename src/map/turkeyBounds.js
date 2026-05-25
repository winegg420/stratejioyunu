import L from 'leaflet';
import { MAP_GEO } from './mapGeoConfig';

/** Harita görünüm kutusu — MAP_GEO.bounds */
export const MAP_BOUNDS = { ...MAP_GEO.bounds };

/** @deprecated alias — mevcut importlar */
export const TURKEY_BOUNDS = MAP_BOUNDS;

export const MAP_MAX_BOUNDS = L.latLngBounds(
  [MAP_BOUNDS.south, MAP_BOUNDS.west],
  [MAP_BOUNDS.north, MAP_BOUNDS.east],
);

/** @deprecated alias */
export const TURKEY_MAX_BOUNDS = MAP_MAX_BOUNDS;

export function clampLatLng(lat, lng) {
  return {
    lat: Math.min(MAP_BOUNDS.north, Math.max(MAP_BOUNDS.south, lat)),
    lng: Math.min(MAP_BOUNDS.east, Math.max(MAP_BOUNDS.west, lng)),
  };
}

export function clampLatLngBounds(bounds) {
  if (!bounds?.getSouth) return bounds;
  const sw = clampLatLng(bounds.getSouth(), bounds.getWest());
  const ne = clampLatLng(bounds.getNorth(), bounds.getEast());
  return L.latLngBounds([sw.lat, sw.lng], [ne.lat, ne.lng]);
}
