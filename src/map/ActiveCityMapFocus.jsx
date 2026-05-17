import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Harita açılışında ve aktif şehir değişince kamerayı üsse kilitle. */
export default function ActiveCityMapFocus({ lat, lng, activeCityId }) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null) return;
    map.setView([lat, lng], 6, { animate: false });
  }, [map, activeCityId, lat, lng]);

  return null;
}
