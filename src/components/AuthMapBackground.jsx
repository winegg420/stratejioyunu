import { useEffect, useState } from 'react';

function ringToPoints(ring) {
  return ring
    .map(([lng, lat]) => `${((lng - 25.5) / 19) * 400},${((42.2 - lat) / 12) * 280}`)
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
    fetch('/geo/provinces.json')
      .then((r) => r.json())
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
