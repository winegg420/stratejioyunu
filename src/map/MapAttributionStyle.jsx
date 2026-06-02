import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Leaflet attribution — prefix temizle, tema ile uyumlu küçük gri metin */
export default function MapAttributionStyle() {
  const map = useMap();

  useEffect(() => {
    const control = map.attributionControl;
    if (!control) return;
    control.setPrefix('');
  }, [map]);

  return null;
}
