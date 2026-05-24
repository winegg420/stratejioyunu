import { supabase, isSupabaseConfigured } from './supabase';

/** Token bitmeden önce yenile (ms) */
const REFRESH_BEFORE_EXPIRY_MS = 8 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

let refreshInFlight = null;

export async function refreshSessionIfNeeded() {
  if (!isSupabaseConfigured || !supabase) return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const { data: current, error: readErr } = await supabase.auth.getSession();
      if (readErr) {
        console.warn('[sessionKeeper] getSession', readErr);
        return null;
      }

      const session = current?.session;
      if (!session) return null;

      const expiresAtMs = (session.expires_at ?? 0) * 1000;
      const now = Date.now();
      if (expiresAtMs > now + REFRESH_BEFORE_EXPIRY_MS) {
        return session;
      }

      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) {
        console.warn('[sessionKeeper] refreshSession', refreshErr);
        return session;
      }
      return refreshed?.session ?? session;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function startSessionKeeper() {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const tick = () => {
    refreshSessionIfNeeded().catch(() => {});
  };

  const intervalId = window.setInterval(tick, CHECK_INTERVAL_MS);

  const onVisible = () => {
    if (document.visibilityState === 'visible') tick();
  };
  document.addEventListener('visibilitychange', onVisible);

  tick();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
