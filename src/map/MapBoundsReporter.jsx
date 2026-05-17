import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { clampLatLngBounds } from './turkeyBounds';

export default function MapBoundsReporter({ onViewportChange }) {
  const map = useMap();

  useEffect(() => {
    const report = () => {
      onViewportChange({
        bounds: clampLatLngBounds(map.getBounds()),
        center: map.getCenter(),
        zoom: map.getZoom(),
      });
    };
    map.on('moveend zoomend', report);
    report();
    return () => {
      map.off('moveend zoomend', report);
    };
  }, [map, onViewportChange]);

  return null;
}
