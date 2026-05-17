import { useGameStore } from './gameStore';

/** @deprecated use useGameStore — geriye uyumluluk */
export function useResourceStore(selector) {
  return useGameStore((state) =>
    selector({
      resources: state.cities[state.activeCityId]?.resources ?? [],
      flashes: state.flashes,
      startTicker: state.startTicker,
    }),
  );
}
