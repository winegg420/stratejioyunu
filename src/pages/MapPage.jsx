import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MapErrorBoundary from '../components/MapErrorBoundary';
import TurkeyMap from '../map/TurkeyMap';
import { useLanguage } from '../context/LanguageContext';
import { useGameStore } from '../stores/gameStore';

export default function MapPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const mapTargetPickRequest = useGameStore((s) => s.mapTargetPickRequest);
  const requestMapTargetPick = useGameStore((s) => s.requestMapTargetPick);

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
    <div className="page page--console map-page-wrapper map-page-wrapper--tactical">
      <header className="map-page-compact-header">
        <h1 className="map-page-compact-header__title">{t('pages.map.title')}</h1>
        <span className="map-page-compact-header__meta">{t('map.pageMeta')}</span>
      </header>
      <MapErrorBoundary className="map-error-boundary-wrap">
        <TurkeyMap />
      </MapErrorBoundary>
    </div>
  );
}
