import { useEffect, useMemo, useState } from 'react';
import { TURKEY_BOUNDS, clampLatLng } from './turkeyBounds';

const TURKEY = TURKEY_BOUNDS;

function toPercent(lat, lng) {
  const c = clampLatLng(lat, lng);
  const x = ((c.lng - TURKEY.west) / (TURKEY.east - TURKEY.west)) * 100;
  const y = ((TURKEY.north - c.lat) / (TURKEY.north - TURKEY.south)) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

function ringToPoints(ring) {
  return ring
    .map(([lng, lat]) => {
      const { x, y } = toPercent(lat, lng);
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

function boundsToRect(bounds) {
  if (!bounds) return null;
  const sw = toPercent(bounds.getSouth(), bounds.getWest());
  const ne = toPercent(bounds.getNorth(), bounds.getEast());
  return {
    left: sw.x,
    top: ne.y,
    width: Math.max(4, ne.x - sw.x),
    height: Math.max(4, sw.y - ne.y),
  };
}

export default function MapMiniMap({ viewport, activeCity, mapCities }) {
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

  const viewportRect = useMemo(
    () => boundsToRect(viewport?.bounds),
    [viewport],
  );

  const markers = useMemo(
    () => mapCities.filter((c) => c.status === 'own' || c.status === 'enemy').slice(0, 50),
    [mapCities],
  );

  return (
    <div className="map-minimap" aria-label="Türkiye mini harita">
      <span className="map-minimap-label">Mini Harita</span>
      <div className="map-minimap-canvas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="map-minimap-svg">
          {polygons.map((points, i) => (
            <polygon key={i} points={points} className="map-minimap-land" />
          ))}
          {markers.map((c) => {
            const { x, y } = toPercent(c.lat, c.lng);
            return (
              <circle
                key={c.name}
                cx={x}
                cy={y}
                r={c.status === 'own' ? 1.2 : 0.9}
                className={c.status === 'own' ? 'map-minimap-dot--own' : 'map-minimap-dot--enemy'}
              />
            );
          })}
          {activeCity && (() => {
            const { x, y } = toPercent(activeCity.lat, activeCity.lng);
            return <circle cx={x} cy={y} r={2} className="map-minimap-dot--active" />;
          })()}
          {viewportRect && (
            <rect
              x={viewportRect.left}
              y={viewportRect.top}
              width={viewportRect.width}
              height={viewportRect.height}
              className="map-minimap-viewport"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
