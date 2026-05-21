import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';

export default function MapMaxBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(TURKEY_MAX_BOUNDS);
    map.setMaxBoundsViscosity(0.35);
    map.setMinZoom(5);
    if (map.getZoom() < 5) map.setZoom(5);
    const center = map.getCenter();
    if (TURKEY_MAX_BOUNDS && !TURKEY_MAX_BOUNDS.contains(center)) {
      map.fitBounds(TURKEY_MAX_BOUNDS, {
        animate: false,
        maxZoom: Math.max(5, map.getZoom()),
      });
    }
  }, [map]);

  return null;
}
