import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** ARAMA Enter — Leaflet map.flyTo (zoom varsayılan 5) */
export default function MapSearchFlyBridge({ flyRequest, onDone }) {
  const map = useMap();

  useEffect(() => {
    if (!flyRequest || flyRequest.lat == null || flyRequest.lng == null) return undefined;

    const zoom = flyRequest.zoom ?? 5;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      map.off('moveend', finish);
      onDone?.();
    };

    map.once('moveend', finish);
    map.flyTo([flyRequest.lat, flyRequest.lng], zoom, {
      animate: true,
      duration: 0.85,
      easeLinearity: 0.25,
    });

    const fallback = window.setTimeout(finish, 1400);
    return () => {
      finished = true;
      map.off('moveend', finish);
      window.clearTimeout(fallback);
    };
  }, [map, flyRequest, onDone]);

  return null;
}
