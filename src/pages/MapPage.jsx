import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import MapErrorBoundary from '../components/MapErrorBoundary';
import TurkeyMap from '../map/TurkeyMap';
import HudBackButton from '../components/HudBackButton';
import { useLanguage } from '../context/LanguageContext';
import { useGameStore } from '../stores/gameStore';

export default function MapPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mapTargetPickRequest = useGameStore((s) => s.mapTargetPickRequest);
  const requestMapTargetPick = useGameStore((s) => s.requestMapTargetPick);
  const requestMapExpeditionLaunch = useGameStore((s) => s.requestMapExpeditionLaunch);

  useEffect(() => {
    if (searchParams.get('mode') !== 'expedition') return;
    requestMapExpeditionLaunch();
  }, [searchParams, requestMapExpeditionLaunch]);

  useEffect(() => {
    const field = location.state?.mapPickField;
    if (!field || mapTargetPickRequest) return;
    requestMapTargetPick(
      field,
      location.state?.mapPickReturn ?? '/istihbarat',
    );
  }, [
    location.state?.mapPickField,
    location.state?.mapPickReturn,
    mapTargetPickRequest,
    requestMapTargetPick,
  ]);

  return (
    <MapErrorBoundary className="map-page-wrapper map-page-wrapper--tactical map-page-wrapper--fill">
      <header className="map-page-compact-header">
        <HudBackButton fallback="/" label={t('nav.city')} className="btn btn-secondary btn-sm hud-back-btn map-page-compact-header__back" />
        <h1 className="map-page-compact-header__title">{t('pages.map.title')}</h1>
        <span className="map-page-compact-header__meta">{t('map.pageMeta')}</span>
      </header>
      <TurkeyMap />
    </MapErrorBoundary>
  );
}
