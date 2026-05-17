import { useGameStore } from '../stores/gameStore';
import ExpeditionRoutesLayer from './ExpeditionRoutesLayer';
import TradeRouteCargoLayer from './TradeRouteCargoLayer';

/** tick(now) güncellemelerini harita kabuğundan ayırır — sınır titremesini önler. */
export default function MapAnimatedLayers({ mapCities, playerCities, expeditions }) {
  const now = useGameStore((s) => s.now);

  return (
    <>
      <ExpeditionRoutesLayer
        expeditions={expeditions}
        mapCities={mapCities}
        playerCities={playerCities}
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
