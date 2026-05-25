import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_GEO } from './mapGeoConfig';

/** Harita açılışında aktif üsse odaklan — geri yükleme / hedef uçuş varken devre dışı. */
export default function ActiveCityMapFocus({
  lat,
  lng,
  activeCityId,
  disabled = false,
}) {
  const map = useMap();
  const lastCityRef = useRef(null);
  const didFocusRef = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (lat == null || lng == null) return;
    if (didFocusRef.current && lastCityRef.current === activeCityId) return;
    didFocusRef.current = true;
    lastCityRef.current = activeCityId;

    const minZoom = MAP_GEO.mode === 'world' ? MAP_GEO.zoom : 6;
    const zoom = Math.max(map.getZoom(), minZoom);
    map.flyTo([lat, lng], zoom, { animate: true, duration: 0.9, easeLinearity: 0.25 });
  }, [map, activeCityId, lat, lng, disabled]);

  return null;
}
