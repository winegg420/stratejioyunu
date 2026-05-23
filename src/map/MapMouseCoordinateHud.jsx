import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

/** Taktik grid koordinatı (LOC: x, y) */
export function latLngToLoc(lat, lng) {
  const x = Math.round(((lng - 26) / 19) * 999);
  const y = Math.round(((42 - lat) / 6) * 999);
  return {
    x: Math.max(0, Math.min(999, x)),
    y: Math.max(0, Math.min(999, y)),
  };
}

export default function MapMouseCoordinateHud() {
  const map = useMap();
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    const onMove = (e) => {
      const { lat, lng } = e.latlng;
      setLoc(latLngToLoc(lat, lng));
    };
    const onLeave = () => setLoc(null);

    map.on('mousemove', onMove);
    map.on('mouseout', onLeave);
    return () => {
      map.off('mousemove', onMove);
      map.off('mouseout', onLeave);
    };
  }, [map]);

  return (
    <div className="map-loc-hud font-hud-data" aria-live="polite">
      {loc ? (
        <span>LOC: {loc.x}, {loc.y}</span>
      ) : (
        <span className="map-loc-hud__idle">LOC: — , —</span>
      )}
    </div>
  );
}
