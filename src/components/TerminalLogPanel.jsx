import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useTerminalLogStore } from '../stores/terminalLogStore';

export const TERMINAL_DOCK_LOGS_ID = 'terminal-dock-logs';

export default function TerminalLogPanel({
  title,
  tag = 'SİSTEM',
  className = '',
  children,
}) {
  const append = useTerminalLogStore((s) => s.append);

  useEffect(() => {
    if (title) append(`${tag} :: ${title}`, tag);
  }, [title, tag, append]);

  const dock = typeof document !== 'undefined'
    ? document.getElementById(TERMINAL_DOCK_LOGS_ID)
    : null;

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
