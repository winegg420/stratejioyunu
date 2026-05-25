import { useEffect, useState } from 'react';
import { MAP_BOUNDS } from '../map/turkeyBounds';
import { fetchMapGeo } from '../map/mapGeoLoader';

function ringToPoints(ring) {
  return ring
    .map(([lng, lat]) => {
      const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 400;
      const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 280;
      return `${x},${y}`;
    })
    .join(' ');
}

function featureToPolygons(feature) {
  const { type, coordinates } = feature.geometry;
  if (type === 'Polygon') return [coordinates[0]];
  if (type === 'MultiPolygon') return coordinates.map((poly) => poly[0]);
  return [];
}

export default function AuthMapBackground() {
  const [polygons, setPolygons] = useState([]);

  useEffect(() => {
    fetchMapGeo()
      .then((data) => {
        const all = data.features.flatMap((f) =>
          featureToPolygons(f).map((ring) => ringToPoints(ring)),
        );
        setPolygons(all);
      })
      .catch(() => setPolygons([]));
  }, []);

  return (
    <div className="auth-map-bg" aria-hidden="true">
      <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
        {polygons.map((points, i) => (
          <polygon key={i} points={points} />
        ))}
      </svg>
    </div>
  );
}
