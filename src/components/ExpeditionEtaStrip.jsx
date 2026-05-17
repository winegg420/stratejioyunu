import { formatSeconds } from '../lib/gameUtils';
import { formatArrivalClock } from '../lib/expeditionConfig';
import { useGameStore } from '../stores/gameStore';

export default function ExpeditionEtaStrip({ durationSeconds }) {
  const now = useGameStore((s) => s.now);
  const duration = Math.max(0, durationSeconds);

  return (
    <p className="city-panel-eta" aria-live="polite">
      <span className="city-panel-eta-label">Sefer süresi:</span>
      <span className="city-panel-eta-duration">{formatSeconds(duration)}</span>
      <span className="city-panel-eta-sep" aria-hidden="true">·</span>
      <span className="city-panel-eta-label">Varış:</span>
      <strong className="city-panel-eta-arrival">{formatArrivalClock(duration, now)}</strong>
    </p>
  );
}
