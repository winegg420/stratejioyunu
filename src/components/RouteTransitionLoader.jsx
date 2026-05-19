import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const LINES = [
  '> ROUTE_HANDSHAKE_OK',
  '> LOADING_CITY_STATE...',
  '> SYNC_RESOURCE_TICK...',
  '> HUD_SHELL_MOUNT',
];

export default function RouteTransitionLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    setVisible(true);
    setLine(0);
    const t1 = window.setTimeout(() => setVisible(false), 300);
    return () => window.clearTimeout(t1);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return undefined;
    const iv = window.setInterval(() => {
      setLine((n) => (n + 1) % LINES.length);
    }, 80);
    return () => window.clearInterval(iv);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="route-transition-loader" aria-hidden="true">
      <div className="route-transition-loader__scanline" />
      <p className="route-transition-loader__line font-hud-data">{LINES[line]}</p>
    </div>
  );
}
