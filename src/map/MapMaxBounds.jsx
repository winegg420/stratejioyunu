import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';

export default function MapMaxBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(TURKEY_MAX_BOUNDS);
    map.setMaxBoundsViscosity(1.0);
    map.setMinZoom(5);
    if (map.getZoom() < 5) map.setZoom(5);
    if (!TURKEY_MAX_BOUNDS.contains(map.getCenter())) {
      map.panInsideBounds(TURKEY_MAX_BOUNDS, { animate: false });
    }
  }, [map]);

  return null;
}
