import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMilAiLiveContext, MIL_AI_ADVICE_REFRESH_MS } from '../lib/milAiLiveAdvice';
import { getLastSyncUserId } from '../lib/supabaseSync';
import { useGameStore } from '../stores/gameStore';

/** MIL-AI tavsiyesi — Supabase bağlamı, 5 dk'da bir yenilenir. */
export function useMilAiLiveContext() {
  const { session } = useAuth();
  const gameHydrating = useGameStore((s) => s.gameHydrating);
  const syncKey = useGameStore(
    (s) => `${s.expeditions?.length ?? 0}:${s.mapRouteSyncRev ?? 0}:${(s.intelOperations ?? []).length}`,
  );
  const [remote, setRemote] = useState(null);

  const refresh = useCallback(async () => {
    const profileId = session?.user?.id ?? getLastSyncUserId();
    if (!profileId) return;
    const ctx = await fetchMilAiLiveContext(profileId);
    if (ctx) setRemote(ctx);
  }, [session?.user?.id]);

  useEffect(() => {
    if (gameHydrating) return undefined;
    refresh();
    const timer = window.setInterval(refresh, MIL_AI_ADVICE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh, gameHydrating, syncKey]);

  return remote;
}
