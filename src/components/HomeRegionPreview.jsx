import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { normalizeProvinceCode } from '../map/mapOwnership';
import { featureToViewBoxPolygons, getFeatureBounds } from '../map/geoUtils';
import { fetchMapGeo } from '../map/mapGeoLoader';

export default function HomeRegionPreview() {
  const playerCities = useGameStore((s) => s.playerCities);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const [provinces, setProvinces] = useState(null);

  const activeCity = playerCities.find((c) => c.id === activeCityId) ?? playerCities[0];
  const playerName = getCurrentPlayerName();
  const provinceCode = activeCity?.province;

  useEffect(() => {
    fetchMapGeo()
      .then(setProvinces)
      .catch(() => setProvinces(null));
  }, []);

  const regionData = useMemo(() => {
    if (!provinces?.features?.length || !provinceCode) return null;
    const code = normalizeProvinceCode(provinceCode);
    const feature = provinces.features.find(
      (f) => normalizeProvinceCode(f.properties?.shapeISO) === code
        || f.properties?.shapeName === activeCity?.provinceName,
    );
    if (!feature) return null;

    const bounds = getFeatureBounds(feature);
    const polygons = featureToViewBoxPolygons(feature, bounds);
    const regionName = feature.properties?.shapeName ?? activeCity?.provinceName ?? 'Bölge';

    return { polygons, regionName, bounds };
  }, [provinces, provinceCode, activeCity?.provinceName]);

  const ownCityDots = useMemo(() => {
    if (!regionData) return [];
    const { bounds } = regionData;
    const { minLat, maxLat, minLng, maxLng } = bounds;
    const latSpan = maxLat - minLat || 1;
    const lngSpan = maxLng - minLng || 1;
    const pad = 0.08;

    return playerCities
      .filter((c) => normalizeProvinceCode(c.province) === normalizeProvinceCode(provinceCode))
      .map((c) => ({
        id: c.id,
        name: c.name,
        x: ((c.lng - minLng) / lngSpan) * (1 - 2 * pad) * 100 + pad * 100,
        y: ((maxLat - c.lat) / latSpan) * (1 - 2 * pad) * 100 + pad * 100,
      }));
  }, [playerCities, provinceCode, regionData]);

  return (
    <section className="panel home-region-preview">
      <div className="home-region-preview__head">
        <h3 className="panel-title">
          <span className="panel-title__icon">🗺️</span>
          Bölge Haritası
        </h3>
        <Link to="/harita" className="btn btn-hud-secondary btn-sm">
          Tam Harita →
        </Link>
      </div>
      <p className="home-region-preview__sub">
        {regionData?.regionName ?? activeCity?.provinceName ?? '—'} · <strong>{playerName}</strong>
      </p>
      <div className="home-region-preview__canvas">
        {regionData ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="home-region-preview__svg">
            {regionData.polygons.map((points, i) => (
              <polygon
                key={i}
                points={points}
                className={i === 0 ? 'home-region-preview__land' : 'home-region-preview__land home-region-preview__land--hole'}
              />
            ))}
            {ownCityDots.map((dot) => (
              <g key={dot.id}>
                <circle cx={dot.x} cy={dot.y} r={2.2} className="home-region-preview__city-dot" />
                <text x={dot.x} y={dot.y - 3.5} className="home-region-preview__city-label">
                  {dot.name}
                </text>
              </g>
            ))}
            <text x={50} y={92} textAnchor="middle" className="home-region-preview__owner-label">
              {playerName}
            </text>
          </svg>
        ) : (
          <div className="home-region-preview__fallback" aria-hidden="true">
            <span>Bölge yükleniyor…</span>
          </div>
        )}
      </div>
    </section>
  );
}
