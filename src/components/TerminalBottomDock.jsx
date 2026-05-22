import { useEffect, useRef, useState } from 'react';
import CommandTickerFeed from './CommandTickerFeed';
import CyberTerminalPlaceholder from './CyberTerminalPlaceholder';
import { TERMINAL_DOCK_LOGS_ID } from './TerminalLogPanel';

export default function TerminalBottomDock() {
  const shellRef = useRef(null);
  const logsRef = useRef(null);
  const [hasLogs, setHasLogs] = useState(false);

  useEffect(() => {
    const el = logsRef.current;
    if (!el) return undefined;

    const syncContent = () => setHasLogs(el.childElementCount > 0);
    syncContent();
    const mo = new MutationObserver(syncContent);
    mo.observe(el, { childList: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const syncHeight = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty('--terminal-dock-logs-h', `${h}px`);
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--terminal-dock-logs-h', '0px');
    };
  }, [hasLogs]);

  return (
    <aside className="terminal-bottom-dock" aria-label="Operasyon terminali">
      <div
        ref={shellRef}
        className={`terminal-dock-logs${hasLogs ? '' : ' terminal-dock-logs--idle'}`}
      >
        <div ref={logsRef} id={TERMINAL_DOCK_LOGS_ID} className="terminal-dock-logs__portals" />
        {!hasLogs && (
          <CyberTerminalPlaceholder variant="scan" className="terminal-dock-logs__placeholder" />
        )}
      </div>
      <CommandTickerFeed />
    </aside>
  );
}
