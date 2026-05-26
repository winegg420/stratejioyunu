import { useGameStore } from '../stores/gameStore';
import ExpeditionRoutesLayer from './ExpeditionRoutesLayer';
import ExpeditionProgressMarkers from './ExpeditionProgressMarkers';
import TradeRouteCargoLayer from './TradeRouteCargoLayer';

/** tick(now) güncellemelerini harita kabuğundan ayırır — sınır titremesini önler. */
export default function MapAnimatedLayers({ mapCities, playerCities, expeditions }) {
  const now = useGameStore((s) => s.now);
  const routeSyncRev = useGameStore((s) => s.mapRouteSyncRev ?? 0);

  return (
    <>
      <ExpeditionRoutesLayer
        expeditions={expeditions}
        mapCities={mapCities}
        playerCities={playerCities}
        routeSyncRev={routeSyncRev}
      />
      <ExpeditionProgressMarkers
        expeditions={expeditions}
        mapCities={mapCities}
        playerCities={playerCities}
        now={now}
      />
      <TradeRouteCargoLayer
        expeditions={expeditions}
        mapCities={mapCities}
        playerCities={playerCities}
        now={now}
      />
    </>
  );
}
