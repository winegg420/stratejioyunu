import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_GEO } from './mapGeoConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';

/** Zoom / dokunma — dünya modunda Leaflet sürükleme + tekerlek açık */
export default function MapPanZoomController({ enabled = true }) {
  const map = useMap();

  useEffect(() => {
    if (!IS_WORLD_MAP) {
      map.dragging.disable();
    } else if (enabled) {
      map.dragging.enable();
    }
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
      if (IS_WORLD_MAP) map.dragging.disable();
    }
  }, [map, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const container = map.getContainer();
    if (!container) return undefined;

    const captureWheel = (e) => {
      e.stopPropagation();
    };
    container.addEventListener('wheel', captureWheel, { capture: true, passive: false });

    return () => {
      container.removeEventListener('wheel', captureWheel, { capture: true });
    };
  }, [map, enabled]);

  return null;
}
