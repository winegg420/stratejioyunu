import { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import { FOG_FILL } from './cyberMapConfig';
import { buildFogPolygonPositions, getVisionZones } from './fogUtils';

export default function FogOfWarLayer({
  playerCities,
  mapCities,
  expeditions,
  reports,
}) {
  const positions = useMemo(() => {
    const zones = getVisionZones({ playerCities, mapCities, expeditions, reports });
    return buildFogPolygonPositions(zones);
  }, [playerCities, mapCities, expeditions, reports]);

  return (
    <Polygon
      positions={positions}
      pathOptions={FOG_FILL}
      interactive={false}
      className="cyber-fog-layer"
    />
  );
}
