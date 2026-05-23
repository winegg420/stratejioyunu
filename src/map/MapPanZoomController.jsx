import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Zoom / dokunma — sürükleme MapDragPanController'da */
export default function MapPanZoomController({ enabled = true }) {
  const map = useMap();

  useEffect(() => {
    map.dragging.disable();
    if (enabled) {
      map.touchZoom.enable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    } else {
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [map, enabled]);

  return null;
}
