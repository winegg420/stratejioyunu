import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const MIN_VISIBLE_MS = 280;

/** İçerik alanı — sayfa geçişinde siber yükleme katmanı */
export default function PageRouteLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setVisible(true);
    setTick((n) => n + 1);
    const hideAt = window.setTimeout(() => setVisible(false), MIN_VISIBLE_MS);
    return () => window.clearTimeout(hideAt);
  }, [pathname]);

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
          {`SYNC_${pathname.replace(/\//g, '_').toUpperCase() || 'ROOT'} · T+${tick}`}
        </p>
      </div>
    </div>
  );
}
