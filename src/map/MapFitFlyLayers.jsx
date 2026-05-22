import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, bounds]);
  return null;
}

export function FlyToCity({ lat, lng, zoom = 9 }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5, easeLinearity: 0.25 });
    }
  }, [map, lat, lng, zoom]);
  return null;
}

export default function MapFitFlyLayers({ fitBounds, flyTarget }) {
  return (
    <>
      {fitBounds && <FitBounds bounds={fitBounds} />}
      {flyTarget && <FlyToCity lat={flyTarget.lat} lng={flyTarget.lng} zoom={9} />}
    </>
  );
}
