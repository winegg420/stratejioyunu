import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import MapErrorBoundary from '../components/MapErrorBoundary';
import TurkeyMap from '../map/TurkeyMap';
import { useGameStore } from '../stores/gameStore';

export default function MapPage() {
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
      <TurkeyMap />
    </MapErrorBoundary>
  );
}
