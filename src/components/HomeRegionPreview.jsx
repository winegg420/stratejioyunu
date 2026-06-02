import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { resolvePlayerDisplayName } from '../lib/profileApi';
import { useAuth } from '../context/AuthContext';
import { normalizeProvinceCode } from '../map/mapOwnership';
import { featureToViewBoxPolygons, getFeatureBounds } from '../map/geoUtils';
import { fetchMapGeo } from '../map/mapGeoLoader';
import { useLanguage } from '../context/LanguageContext';
import { getCountryDisplayLabel } from '../lib/countryDisplayNames';
import { useGameDataReady } from '../hooks/useGameDataReady';

export default function HomeRegionPreview() {
  const { t, countryLabel } = useLanguage();
  const gameReady = useGameDataReady();
  const { playerName: authPlayerName, session } = useAuth();
  const profileDisplayName = useGameStore((s) => s.profileDisplayName);
  const profilePlayerName = useGameStore((s) => s.profilePlayerName);
  const playerCities = useGameStore((s) => s.playerCities);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const [provinces, setProvinces] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);

  const activeCity = playerCities.find((c) => c.id === activeCityId) ?? playerCities[0];
  const playerName = resolvePlayerDisplayName({
    user: session?.user,
    profileDisplayName,
    profilePlayerName,
    playerName: authPlayerName,
  });
  const provinceCode = activeCity?.province;

  useEffect(() => {
    let cancelled = false;
    setGeoLoading(true);
    setGeoError(false);
    fetchMapGeo()
      .then((data) => {
        if (!cancelled) {
          setProvinces(data);
          setGeoLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProvinces(null);
          setGeoError(true);
          setGeoLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const regionData = useMemo(() => {
    if (!provinces?.features?.length || !provinceCode || !activeCity) return null;
    const code = normalizeProvinceCode(provinceCode);
    const feature = provinces.features.find(
      (f) => normalizeProvinceCode(f.properties?.shapeISO) === code
        || f.properties?.shapeName === activeCity?.provinceName
        || f.properties?.shapeName === activeCity?.name,
    );
    if (!feature) return null;

    const bounds = getFeatureBounds(feature);
    const polygons = featureToViewBoxPolygons(feature, bounds);
    const regionName = feature.properties?.shapeName ?? activeCity?.provinceName ?? activeCity?.name ?? 'Bölge';

    return { polygons, regionName, bounds };
  }, [provinces, provinceCode, activeCity]);

  const ownCityDots = useMemo(() => {
    if (!regionData || !activeCity) return [];
    const { bounds } = regionData;
    const { minLat, maxLat, minLng, maxLng } = bounds;
    const latSpan = maxLat - minLat || 1;
    const lngSpan = maxLng - minLng || 1;
    const pad = 0.08;

    return playerCities
      .filter((c) => {
        if (c.lat == null || c.lng == null) return false;
        return normalizeProvinceCode(c.province) === normalizeProvinceCode(provinceCode)
          || c.name === activeCity.name
          || c.provinceName === activeCity.provinceName;
      })
      .map((c) => ({
        id: c.id,
        name: countryLabel(c.name),
        x: ((c.lng - minLng) / lngSpan) * (1 - 2 * pad) * 100 + pad * 100,
        y: ((maxLat - c.lat) / latSpan) * (1 - 2 * pad) * 100 + pad * 100,
      }));
  }, [playerCities, provinceCode, regionData, activeCity, countryLabel]);

  const displayCountry = activeCity?.name
    ? countryLabel(activeCity.name)
    : null;
  const displayRegion = regionData?.regionName
    ? countryLabel(regionData.regionName)
    : (activeCity?.provinceName ? countryLabel(activeCity.provinceName) : null);

  let placeholderMessage = t('pages.home.regionPreview.waitingCity');
  if (gameReady && !activeCity) {
    placeholderMessage = t('pages.home.regionPreview.noActiveCity');
  } else if (geoError) {
    placeholderMessage = t('pages.home.regionPreview.geoError');
  } else if (geoLoading) {
    placeholderMessage = t('pages.home.regionPreview.loading');
  } else if (gameReady && activeCity && !regionData) {
    placeholderMessage = t('pages.home.regionPreview.noMapData');
  }

  const showMap = Boolean(regionData?.polygons?.length);

  return (
    <section className="panel home-region-preview glass-panel" aria-label={t('pages.home.regionPreview.aria')}>
      <div className="home-region-preview__head">
        <h3 className="panel-title">
          <span className="panel-title__icon">🗺️</span>
          {t('pages.home.regionPreview.title')}
        </h3>
        <Link to="/harita" className="btn btn-hud-secondary btn-sm">
          {t('pages.home.regionPreview.openMap')}
        </Link>
      </div>
      <p className="home-region-preview__sub">
        {displayRegion ?? displayCountry ?? '—'}
        {' · '}
        <strong>{playerName}</strong>
      </p>
      <div className="home-region-preview__canvas">
        {showMap ? (
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
          <div className="home-region-preview__fallback" role="status">
            <span className="home-region-preview__fallback-icon" aria-hidden="true">◇</span>
            <p className="home-region-preview__fallback-title">
              {displayCountry ?? t('pages.home.regionPreview.placeholderTitle')}
            </p>
            <p className="home-region-preview__fallback-msg">{placeholderMessage}</p>
            {displayCountry && (
              <Link to="/harita" className="btn btn-hud-secondary btn-sm home-region-preview__fallback-cta">
                {t('pages.home.regionPreview.openMap')}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
