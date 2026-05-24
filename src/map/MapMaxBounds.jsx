import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';

export default function MapMaxBounds() {
  const map = useMap();

  useEffect(() => {
    map.options.maxBoundsViscosity = 0.05;
    map.setMaxBounds(TURKEY_MAX_BOUNDS);
    map.setMinZoom(4);
    if (map.getZoom() < 4) map.setZoom(4);
  }, [map]);

  return null;
}
