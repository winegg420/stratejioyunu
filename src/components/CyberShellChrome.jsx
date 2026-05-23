import { useEffect, useState } from 'react';

function useTelemetry() {
  const [latency, setLatency] = useState(12);
  const [coreTemp, setCoreTemp] = useState('OPTIMAL');

  useEffect(() => {
    const tick = () => {
      setLatency(8 + Math.floor(Math.random() * 18));
      setCoreTemp(Math.random() > 0.08 ? 'OPTIMAL' : 'WARM');
    };
    tick();
    const id = window.setInterval(tick, 3200);
    return () => window.clearInterval(id);
  }, []);

  return { latency, coreTemp };
}

function CornerPanel({ side }) {
  const { latency, coreTemp } = useTelemetry();
  return (
    <div className={`cyber-shell-chrome cyber-shell-chrome--${side}`} aria-hidden="true">
      <div className="cyber-shell-chrome__line" />
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>SYS_STATUS</span>
        <strong className="is-ok">SECURE</strong>
      </div>
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>NET_LATENCY</span>
        <strong>{latency}ms</strong>
      </div>
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>CORE_TEMP</span>
        <strong className={coreTemp === 'OPTIMAL' ? 'is-ok' : 'is-sync'}>{coreTemp}</strong>
      </div>
      <div className="cyber-shell-chrome__stat font-hud-data">
        <span>C4ISR</span>
        <strong className="is-ok">ONLINE</strong>
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
