import { useGameStore } from '../stores/gameStore';

/** Şehir/kaynak state hazır mı — geçişlerde mevcut kaynakları korur (stale-while-revalidate) */
export function useGameDataReady() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const hydrating = useGameStore((s) => s.gameHydrating);
  const resources = useGameStore((s) => {
    if (!s.activeCityId) return null;
    return s.cities[s.activeCityId]?.resources;
  });

  if (hydrating) return false;
  if (Array.isArray(resources) && resources.length > 0) return true;
  if (activeCityId && playerCities?.length > 0) {
    const city = useGameStore.getState().cities[activeCityId];
    if (city) return true;
  }
  if (!activeCityId || !playerCities?.length) return false;
  if (!resources || resources.length === 0) return false;
  return true;
}
