import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10, animate: true });
  }, [map, bounds]);
  return null;
}

export function FlyToCity({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    const targetZoom = zoom ?? Math.max(map.getZoom(), 7);
    map.flyTo([lat, lng], targetZoom, { animate: true, duration: 0.85, easeLinearity: 0.25 });
  }, [map, lat, lng, zoom]);
  return null;
}

export default function MapFitFlyLayers({ fitBounds, flyTarget }) {
  const flyKey = flyTarget?.at ?? `${flyTarget?.lat}-${flyTarget?.lng}`;
  return (
    <>
      {fitBounds && <FitBounds bounds={fitBounds} />}
      {flyTarget && (
        <FlyToCity
          key={flyKey}
          lat={flyTarget.lat}
          lng={flyTarget.lng}
          zoom={flyTarget.zoom}
        />
      )}
    </>
  );
}
