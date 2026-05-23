import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHomeCommandStatsFromServer } from '../lib/homeCommandStats';
import { getLastSyncUserId } from '../lib/supabaseSync';
import { useGameStore } from '../stores/gameStore';

const POLL_MS = 12_000;

function sumQueuesAcrossCities(cities = {}) {
  let constructionCount = 0;
  let productionCount = 0;
  for (const city of Object.values(cities)) {
    constructionCount += city?.constructionQueue?.length ?? 0;
    productionCount += city?.productionQueue?.length ?? 0;
  }
  return { constructionCount, productionCount };
}

function countActiveExpeditions(expeditions = []) {
  return expeditions.filter((e) => e.status === 'active' || !e.status).length;
}

/**
 * Yerel store + Supabase poll — widget'larda gerçek sayılar.
 */
export function useHomeCommandStats() {
  const { session } = useAuth();
  const expeditions = useGameStore((s) => s.expeditions);
  const reports = useGameStore((s) => s.reports);
  const cities = useGameStore((s) => s.cities);
  const gameHydrating = useGameStore((s) => s.gameHydrating);
  const _supabaseHydrated = useGameStore((s) => s._supabaseHydrated);

  const localQueues = sumQueuesAcrossCities(cities);
  const localFallback = {
    activeExpeditions: countActiveExpeditions(expeditions),
    constructionCount: localQueues.constructionCount,
    productionCount: localQueues.productionCount,
    unreadReports: (reports ?? []).filter((r) => r.isNew).length,
  };

  const [remote, setRemote] = useState(null);

  const refresh = useCallback(async () => {
    const profileId = session?.user?.id ?? getLastSyncUserId();
    if (!profileId) return;
    const stats = await fetchHomeCommandStatsFromServer(profileId);
    if (stats) setRemote(stats);
  }, [session?.user?.id]);

  useEffect(() => {
    if (gameHydrating) return undefined;
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh, gameHydrating, _supabaseHydrated]);

  const merged = remote
    ? {
        activeExpeditions: remote.activeExpeditions,
        constructionCount: remote.constructionCount,
        productionCount: remote.productionCount,
        unreadReports: remote.unreadReports,
        live: true,
      }
    : { ...localFallback, live: false };

  return merged;
}
