import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_GEO } from './mapGeoConfig';

export function FitBounds({ bounds, animate = true }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10, animate });
  }, [map, bounds, animate]);
  return null;
}

export function FlyToCity({ lat, lng, zoom, onComplete, onSettled }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return undefined;

    const targetZoom = zoom ?? Math.min(MAP_GEO.maxZoom, Math.max(map.getZoom(), MAP_GEO.countryFocusZoom));
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      map.off('moveend', finish);
      onComplete?.();
      onSettled?.();
    };

    map.once('moveend', finish);
    map.flyTo([lat, lng], targetZoom, { animate: true, duration: 0.85, easeLinearity: 0.25 });

    const fallback = window.setTimeout(finish, 1200);

    return () => {
      completed = true;
      map.off('moveend', finish);
      window.clearTimeout(fallback);
    };
  }, [map, lat, lng, zoom, onComplete, onSettled]);
  return null;
}

export default function MapFitFlyLayers({ fitBounds, flyTarget, onFlyComplete, onFlySettled }) {
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
          onSettled={onFlySettled ?? onFlyComplete}
        />
      )}
    </>
  );
}
