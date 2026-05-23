import { useEffect, useRef, useState } from 'react';
import CommandTickerFeed from './CommandTickerFeed';
import CyberTerminalPlaceholder from './CyberTerminalPlaceholder';
import { useTerminalLogStore } from '../stores/terminalLogStore';

export default function TerminalBottomDock() {
  const shellRef = useRef(null);
  const lines = useTerminalLogStore((s) => s.lines);
  const [hasPanelLogs, setHasPanelLogs] = useState(false);

  useEffect(() => {
    const el = document.getElementById('terminal-dock-logs');
    if (!el) return undefined;
    const sync = () => setHasPanelLogs(el.childElementCount > 0);
    sync();
    const mo = new MutationObserver(sync);
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
  }, [lines.length, hasPanelLogs]);

  const showLogs = lines.length > 0 || hasPanelLogs;

  return (
    <aside className="terminal-bottom-dock" aria-label="Operasyon terminali">
      <div
        ref={shellRef}
        className={`terminal-dock-logs${showLogs ? '' : ' terminal-dock-logs--idle'}`}
      >
        {lines.length > 0 && (
          <div className="terminal-dock-logs__scroll" role="log" aria-live="polite" aria-relevant="additions">
            {lines.map((line) => (
              <p key={line.id} className="terminal-dock-log-line">
                <span className="terminal-dock-log-line__tag font-hud-data">[{line.tag}]</span>
                <span className="terminal-dock-log-line__text">{line.text}</span>
              </p>
            ))}
          </div>
        )}
        <div id="terminal-dock-logs" className="terminal-dock-logs__portals" />
        {!showLogs && (
          <CyberTerminalPlaceholder variant="scan" className="terminal-dock-logs__placeholder" />
        )}
      </div>
      <CommandTickerFeed />
    </aside>
  );
}
