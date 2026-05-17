import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';

export default function MapMaxBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(TURKEY_MAX_BOUNDS);
    map.setMinZoom(5);
    if (map.getZoom() < 5) map.setZoom(5);
    const center = TURKEY_MAX_BOUNDS.getCenter();
    if (!TURKEY_MAX_BOUNDS.contains(map.getCenter())) {
      map.panTo(center, { animate: false });
    }
  }, [map]);

  return null;
}
