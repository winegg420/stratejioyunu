import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useGameDataReady } from '../hooks/useGameDataReady';

const MIN_VISIBLE_MS = 280;
const HYDRATION_WAIT_MS = 3000;

/** İçerik alanı — sayfa geçişi + veri bekleme (FETCHING DATA) */
export default function PageRouteLoader() {
  const { pathname } = useLocation();
  const ready = useGameDataReady();
  const hydrating = useGameStore((s) => s.gameHydrating);
  const [routePulse, setRoutePulse] = useState(false);
  const [tick, setTick] = useState(0);
  const [hydrationWait, setHydrationWait] = useState(false);

  const needsGameData = pathname !== '/giris' && pathname !== '/';
  const waitingData = needsGameData && !ready && hydrationWait;

  useEffect(() => {
    setRoutePulse(true);
    setTick((n) => n + 1);
    const hideAt = window.setTimeout(() => setRoutePulse(false), MIN_VISIBLE_MS);
    return () => window.clearTimeout(hideAt);
  }, [pathname]);

  useEffect(() => {
    if (!needsGameData || ready) {
      setHydrationWait(false);
      return undefined;
    }
    setHydrationWait(true);
    const cap = window.setTimeout(() => setHydrationWait(false), HYDRATION_WAIT_MS);
    return () => window.clearTimeout(cap);
  }, [pathname, ready, needsGameData, hydrating]);

  const visible = routePulse || waitingData;

  useEffect(() => {
    if (!visible) return undefined;
    const iv = window.setInterval(() => setTick((n) => n + 1), 120);
    return () => window.clearInterval(iv);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="page-route-loader" aria-live="polite" aria-busy="true">
      <div className="page-route-loader__frame">
        <span className="page-route-loader__spinner" aria-hidden="true" />
        <p className="page-route-loader__title font-hud-data">FETCHING DATA...</p>
        <p className="page-route-loader__sub font-hud-data">
          {waitingData
            ? `AWAIT_SYNC · T+${tick} · MAX ${HYDRATION_WAIT_MS / 1000}s`
            : `SYNC_${pathname.replace(/\//g, '_').toUpperCase() || 'ROOT'} · T+${tick}`}
        </p>
      </div>
    </div>
  );
}
