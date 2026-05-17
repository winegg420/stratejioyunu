import { useGameStore } from '../stores/gameStore';

function formatServerTime(now) {
  const d = new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function ServerTimeClock() {
  const now = useGameStore((s) => s.now);

  return (
    <div className="server-time-clock" title="Küresel sunucu saati">
      <span className="server-time-label">Sunucu</span>
      <time className="server-time-value" dateTime={new Date(now).toISOString()}>
        {formatServerTime(now)}
      </time>
    </div>
  );
}
