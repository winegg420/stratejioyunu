import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const TERMINAL_DOCK_LOGS_ID = 'terminal-dock-logs';

export default function TerminalLogPanel({
  title,
  tag = 'SİSTEM',
  className = '',
  children,
}) {
  const { pathname } = useLocation();
  const [dock, setDock] = useState(null);

  useEffect(() => {
    setDock(document.getElementById(TERMINAL_DOCK_LOGS_ID));
  }, [pathname]);

  const panel = (
    <section className={`terminal-log-panel${className ? ` ${className}` : ''}`}>
      <header className="terminal-log-panel__head">
        <span className="terminal-log-panel__tag font-hud-data">[{tag}]</span>
        {title ? <span className="terminal-log-panel__title">{title}</span> : null}
      </header>
      <div className="terminal-log-panel__body">{children}</div>
    </section>
  );

  if (!dock) return panel;
  return createPortal(panel, dock);
}
