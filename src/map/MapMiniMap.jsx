import { useEffect, useMemo, useState } from 'react';
import { TURKEY_BOUNDS, clampLatLng } from './turkeyBounds';
import { fetchMapGeo } from './mapGeoLoader';
import { MAP_GEO } from './mapGeoConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';
import { useLanguage } from '../context/LanguageContext';

function getViewBounds() {
  if (IS_WORLD_MAP) {
    const { south, north, west, east } = MAP_GEO.bounds;
    const gameplayNorth = MAP_GEO.gameplayNorth ?? north;
    const gameplaySouth = MAP_GEO.gameplaySouth ?? south;
    return {
      south: gameplaySouth,
      north: gameplayNorth,
      west,
      east,
    };
  }
  return TURKEY_BOUNDS;
}

function toPercent(lat, lng, bounds) {
  const c = clampLatLng(lat, lng);
  const spanLng = bounds.east - bounds.west || 1;
  const spanLat = bounds.north - bounds.south || 1;
  const x = ((c.lng - bounds.west) / spanLng) * 100;
  const y = ((bounds.north - c.lat) / spanLat) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

function ringToPoints(ring, bounds) {
  return ring
    .map(([lng, lat]) => {
      const { x, y } = toPercent(lat, lng, bounds);
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

function boundsToRect(bounds, viewBounds) {
  if (!bounds?.getSouth) return null;
  const sw = toPercent(bounds.getSouth(), bounds.getWest(), viewBounds);
  const ne = toPercent(bounds.getNorth(), bounds.getEast(), viewBounds);
  return {
    left: sw.x,
    top: ne.y,
    width: Math.max(2, ne.x - sw.x),
    height: Math.max(2, sw.y - ne.y),
  };
}

export default function MapMiniMap({ viewport, activeCity, mapCities }) {
  const { t } = useLanguage();
  const [polygons, setPolygons] = useState([]);
  const viewBounds = useMemo(() => getViewBounds(), []);

  useEffect(() => {
    if (!IS_WORLD_MAP) {
      fetchMapGeo()
        .then((data) => {
          const all = data.features.flatMap((f) =>
            featureToPolygons(f).map((ring) => ringToPoints(ring, viewBounds)),
          );
          setPolygons(all);
        })
        .catch(() => setPolygons([]));
      return undefined;
    }

    fetchMapGeo()
      .then((data) => {
        const all = data.features.flatMap((f) =>
          featureToPolygons(f).map((ring) => ringToPoints(ring, viewBounds)),
        );
        setPolygons(all);
      })
      .catch(() => setPolygons([]));
    return undefined;
  }, [viewBounds]);

  const viewportRect = useMemo(
    () => boundsToRect(viewport?.bounds, viewBounds),
    [viewport, viewBounds],
  );

  const markers = useMemo(
    () => (mapCities ?? [])
      .filter((c) => c.lat != null && c.lng != null)
      .filter((c) => c.status === 'own' || c.status === 'enemy' || c.status === 'bot')
      .slice(0, IS_WORLD_MAP ? 80 : 50),
    [mapCities],
  );

  const activePos = useMemo(() => {
    if (!activeCity?.lat || activeCity?.lng == null) return null;
    return toPercent(activeCity.lat, activeCity.lng, viewBounds);
  }, [activeCity, viewBounds]);

  return (
    <div
      className={`map-minimap${IS_WORLD_MAP ? ' map-minimap--world' : ''}`}
      aria-label={t('map.minimap.aria')}
    >
      <span className="map-minimap-label">{t('map.minimap.title')}</span>
      <div className="map-minimap-canvas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="map-minimap-svg">
          {IS_WORLD_MAP && (
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              className="map-minimap-ocean"
              rx="2"
            />
          )}
          {polygons.map((points, i) => (
            <polygon key={i} points={points} className="map-minimap-land" />
          ))}
          {markers.map((c) => {
            const { x, y } = toPercent(c.lat, c.lng, viewBounds);
            const r = c.status === 'own' ? 1.4 : 1;
            return (
              <circle
                key={c.name}
                cx={x}
                cy={y}
                r={r}
                className={
                  c.status === 'own'
                    ? 'map-minimap-dot--own'
                    : c.status === 'enemy'
                      ? 'map-minimap-dot--enemy'
                      : 'map-minimap-dot--bot'
                }
              />
            );
          })}
          {activePos && (
            <>
              <circle cx={activePos.x} cy={activePos.y} r={3.8} className="map-minimap-dot--active-halo" />
              <circle cx={activePos.x} cy={activePos.y} r={2.4} className="map-minimap-dot--active" />
            </>
          )}
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
