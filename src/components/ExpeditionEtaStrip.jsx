import { formatSeconds } from '../lib/gameUtils';
import { formatArrivalClock } from '../lib/expeditionConfig';
import { useGameStore } from '../stores/gameStore';

export default function ExpeditionEtaStrip({ durationSeconds, airRush = false }) {
  const now = useGameStore((s) => s.now);
  const duration = Math.max(0, durationSeconds);

  return (
    <p className="city-panel-eta expedition-eta-strip" aria-live="polite">
      <span className="city-panel-eta-label">Sefer süresi:</span>
      <span className="city-panel-eta-duration font-hud-data">{formatSeconds(duration)}</span>
      {airRush && (
        <>
          <span className="city-panel-eta-sep" aria-hidden="true">·</span>
          <span className="city-panel-eta-air">3× hava hızı</span>
        </>
      )}
      <span className="city-panel-eta-sep" aria-hidden="true">·</span>
      <span className="city-panel-eta-label">Varış:</span>
      <strong className="city-panel-eta-arrival font-hud-data">{formatArrivalClock(duration, now)}</strong>
    </p>
  );
}
