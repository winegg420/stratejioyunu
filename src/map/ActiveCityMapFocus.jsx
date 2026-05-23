import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

/** Harita açılışında aktif üsse odaklan — mevcut zoom korunur. */
export default function ActiveCityMapFocus({ lat, lng, activeCityId }) {
  const map = useMap();
  const lastCityRef = useRef(null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    if (lastCityRef.current === activeCityId) return;
    lastCityRef.current = activeCityId;
    const zoom = Math.max(map.getZoom(), 6);
    map.flyTo([lat, lng], zoom, { animate: true, duration: 0.9, easeLinearity: 0.25 });
  }, [map, activeCityId, lat, lng]);

  return null;
}
