import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapInteractionController({ interactionLocked }) {
  const map = useMap();

  useEffect(() => {
    if (interactionLocked) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.disable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    }
  }, [map, interactionLocked]);

  return null;
}
