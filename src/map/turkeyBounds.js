import L from 'leaflet';

/** Türkiye ana harita ve mini-map sınır kutusu */
export const TURKEY_BOUNDS = {
  south: 35.75,
  north: 42.15,
  west: 25.95,
  east: 44.85,
};

export const TURKEY_MAX_BOUNDS = L.latLngBounds(
  [TURKEY_BOUNDS.south, TURKEY_BOUNDS.west],
  [TURKEY_BOUNDS.north, TURKEY_BOUNDS.east],
);

export function clampLatLng(lat, lng) {
  return {
    lat: Math.min(TURKEY_BOUNDS.north, Math.max(TURKEY_BOUNDS.south, lat)),
    lng: Math.min(TURKEY_BOUNDS.east, Math.max(TURKEY_BOUNDS.west, lng)),
  };
}

export function clampLatLngBounds(bounds) {
  if (!bounds?.getSouth) return bounds;
  const sw = clampLatLng(bounds.getSouth(), bounds.getWest());
  const ne = clampLatLng(bounds.getNorth(), bounds.getEast());
  return L.latLngBounds([sw.lat, sw.lng], [ne.lat, ne.lng]);
}
