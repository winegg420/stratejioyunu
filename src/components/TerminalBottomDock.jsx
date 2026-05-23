import { useEffect, useRef, useState } from 'react';
import CommandTickerFeed from './CommandTickerFeed';

export const TERMINAL_DOCK_LOGS_ID = 'terminal-dock-logs';

/** Alt komuta şeridi — akan haber bandı; portallar yalnızca kuyruk panelleri için */
export default function TerminalBottomDock() {
  const portalMountRef = useRef(null);
  const portalPanelRef = useRef(null);
  const [hasPortals, setHasPortals] = useState(false);

  useEffect(() => {
    const el = portalMountRef.current;
    if (!el) return undefined;
    const sync = () => setHasPortals(el.childElementCount > 0);
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const el = portalPanelRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      document.documentElement.style.setProperty('--terminal-dock-logs-h', '0px');
      return undefined;
    }

    const syncHeight = () => {
      const h = hasPortals ? Math.ceil(el.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--terminal-dock-logs-h', `${h}px`);
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--terminal-dock-logs-h', '0px');
    };
  }, [hasPortals]);

  useEffect(() => {
    document.documentElement.style.setProperty('--terminal-dock-ticker-h', '2.35rem');
  }, []);

  return (
    <aside className="terminal-bottom-dock" aria-label="Komuta haber şeridi">
      <div
        ref={portalPanelRef}
        className={['terminal-dock-logs', !hasPortals && 'terminal-dock-logs--hidden'].filter(Boolean).join(' ')}
        aria-hidden={!hasPortals}
      >
        <div id={TERMINAL_DOCK_LOGS_ID} ref={portalMountRef} className="terminal-dock-logs__portals" />
      </div>

      <div className="terminal-dock-ticker-shell">
        <CommandTickerFeed />
      </div>
    </aside>
  );
}
