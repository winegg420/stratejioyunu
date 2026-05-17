import { STORE_EMPTY_ARRAY, useGameStore } from './gameStore';

/** @deprecated use useGameStore — geriye uyumluluk */
export function useResourceStore(selector) {
  return useGameStore((state) =>
    selector({
      resources: state.cities[state.activeCityId]?.resources ?? STORE_EMPTY_ARRAY,
      flashes: state.flashes,
      startTicker: state.startTicker,
    }),
  );
}
