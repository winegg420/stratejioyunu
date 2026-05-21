import { useGameStore } from '../stores/gameStore';

/** Supabase / şehir state gelmeden kaynak ve panellerin çökmesini engeller */
export function useGameDataReady() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => (activeCityId ? s.cities[activeCityId] : null));
  const hydrating = useGameStore((s) => s.gameHydrating);

  if (hydrating) return false;
  if (!activeCityId || !playerCities?.length) return false;
  if (!city || !Array.isArray(city.resources) || city.resources.length === 0) return false;
  return true;
}
