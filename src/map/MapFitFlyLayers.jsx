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

export function FlyToCity({ lat, lng, zoom, onComplete }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return undefined;

    const targetZoom = zoom ?? Math.max(map.getZoom(), 7);
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      map.off('moveend', finish);
      onComplete?.();
    };

    map.once('moveend', finish);
    map.flyTo([lat, lng], targetZoom, { animate: true, duration: 0.85, easeLinearity: 0.25 });

    const fallback = window.setTimeout(finish, 1200);

    return () => {
      completed = true;
      map.off('moveend', finish);
      window.clearTimeout(fallback);
    };
  }, [map, lat, lng, zoom, onComplete]);
  return null;
}

export default function MapFitFlyLayers({ fitBounds, flyTarget, onFlyComplete }) {
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
          onComplete={flyTarget.openPanelAfter ? onFlyComplete : undefined}
        />
      )}
    </>
  );
}
