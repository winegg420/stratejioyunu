import { useEffect, useState } from 'react';

function useTelemetry() {
  const [cpu, setCpu] = useState(42);
  const [net, setNet] = useState('OK');

  useEffect(() => {
    const tick = () => {
      setCpu(38 + Math.floor(Math.random() * 18));
      setNet(Math.random() > 0.04 ? 'OK' : 'SYNC');
    };
    tick();
    const id = window.setInterval(tick, 3200);
    return () => window.clearInterval(id);
  }, []);

  return { cpu, net };
}

function CornerPanel({ side }) {
  const { cpu, net } = useTelemetry();
  return (
    <div className={`cyber-shell-chrome cyber-shell-chrome--${side}`} aria-hidden="true">
      <div className="cyber-shell-chrome__line" />
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>CPU</span>
        <strong>{cpu}%</strong>
      </div>
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>NET</span>
        <strong className={net === 'OK' ? 'is-ok' : 'is-sync'}>{net}</strong>
      </div>
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>HUD</span>
        <strong className="is-ok">LIVE</strong>
      </div>
      <div className="cyber-shell-chrome__grid" />
    </div>
  );
}

/** Geniş ekranlarda yan boşluklara dekoratif terminal verisi */
export default function CyberShellChrome() {
  return (
    <>
      <CornerPanel side="left" />
      <CornerPanel side="right" />
    </>
  );
}
