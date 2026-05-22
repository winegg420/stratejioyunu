import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

export default function MapHexClickPulse({ onMapClick }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const point = map.latLngToContainerPoint(e.latlng);
      onMapClick?.({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: point.x,
        y: point.y,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    container.classList.add('turkey-map--hex-pulse');
    return () => container.classList.remove('turkey-map--hex-pulse');
  }, [map]);

  return null;
}
