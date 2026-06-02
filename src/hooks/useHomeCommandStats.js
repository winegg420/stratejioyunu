import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '../context/AuthContext';
import { fetchHomeCommandStatsFromServer } from '../lib/homeCommandStats';
import { getLastSyncUserId } from '../lib/supabaseSync';
import { useGameStore, useHomeActiveOperationsCount } from '../stores/gameStore';

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

/**
 * Yerel store (anlık) + Supabase poll — aktif operasyon: sefer, siber, istihbarat.
 */
export function useHomeCommandStats() {
  const { session } = useAuth();
  const activeOpsCount = useHomeActiveOperationsCount();
  const { reports, cities, gameHydrating, _supabaseHydrated } = useGameStore(
    useShallow((s) => ({
      reports: s.reports,
      cities: s.cities,
      gameHydrating: s.gameHydrating,
      _supabaseHydrated: s._supabaseHydrated,
    })),
  );

  const localQueues = sumQueuesAcrossCities(cities);

  const localFallback = useMemo(
    () => ({
      activeOperations: activeOpsCount,
      constructionCount: localQueues.constructionCount,
      productionCount: localQueues.productionCount,
      unreadReports: (reports ?? []).filter((r) => r.isNew).length,
    }),
    [activeOpsCount, localQueues, reports],
  );

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
  }, [refresh, gameHydrating, _supabaseHydrated, activeOpsCount]);

  return useMemo(
    () => ({
      activeExpeditions: activeOpsCount,
      activeOperations: activeOpsCount,
      constructionCount: remote?.constructionCount ?? localFallback.constructionCount,
      productionCount: remote?.productionCount ?? localFallback.productionCount,
      unreadReports: remote?.unreadReports ?? localFallback.unreadReports,
      live: Boolean(remote),
    }),
    [activeOpsCount, localFallback, remote],
  );
}
