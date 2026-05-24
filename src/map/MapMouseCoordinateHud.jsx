import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

import { safeLatLngToLoc } from '../lib/mapSafeUtils';

/** Taktik grid koordinatı (LOC: x, y) */
export function latLngToLoc(lat, lng) {
  return safeLatLngToLoc(lat, lng);
}

/** Taktik grid — yalnızca boş harita üzerinde; şehir hover / tam ekranda gizli */
export default function MapMouseCoordinateHud({ visible = true } = {}) {
  const map = useMap();
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    let active = true;
    const onMove = (e) => {
      if (!active || !e?.latlng) return;
      try {
        const { lat, lng } = e.latlng;
        setLoc(latLngToLoc(lat, lng));
      } catch {
        /* ignore hover glitch */
      }
    };
    const onLeave = () => {
      if (active) setLoc(null);
    };

    map.on('mousemove', onMove);
    map.on('mouseout', onLeave);
    return () => {
      active = false;
      map.off('mousemove', onMove);
      map.off('mouseout', onLeave);
    };
  }, [map]);

  if (!visible) return null;

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
