import L from 'leaflet';

/**
 * Harita görünüm kutusu — Türkiye + geniş tampon (Akdeniz / Karadeniz / komşu ülkeler).
 * Oyuncu haritayı serbestçe kaydırabilir; sert geri çekme yok.
 */
export const TURKEY_BOUNDS = {
  south: 30.5,
  north: 45.5,
  west: 17.0,
  east: 52.5,
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
