import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Harita sürükleme ve tekerlek zoom — açık/kapalı */
export default function MapPanZoomController({ enabled = true }) {
  const map = useMap();

  useEffect(() => {
    if (enabled) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [map, enabled]);

  return null;
}
