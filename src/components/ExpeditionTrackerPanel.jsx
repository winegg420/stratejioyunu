import { useGameStore } from '../stores/gameStore';
import { formatSeconds } from '../lib/gameUtils';

const DIRECTION_META = {
  outgoing: { icon: '↗️', label: 'Gidiş' },
  returning: { icon: '↙️', label: 'Dönüş' },
};

function ExpeditionRow({ expedition }) {
  const remaining = expedition.remainingSeconds;
  const total = expedition._initialSeconds || remaining || 1;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const dir = DIRECTION_META[expedition.direction] || DIRECTION_META.outgoing;

  return (
    <li className={`expedition-track-row expedition-track-row--${expedition.direction}`}>
      <div className="expedition-track-main">
        <span className="expedition-track-dir" title={dir.label}>
          {dir.icon}
        </span>
        <div>
          <strong>{expedition.target}</strong>
          <span className="expedition-track-type">{expedition.type}</span>
          <span className="expedition-track-troops">{expedition.troops}</span>
        </div>
      </div>
      <span className="expedition-track-timer">{formatSeconds(remaining)}</span>
      {remaining > 0 && (
        <div className="expedition-track-progress" aria-hidden="true">
          <div className="expedition-track-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </li>
  );
}

export default function ExpeditionTrackerPanel() {
  const expeditions = useGameStore((s) => s.expeditions);

  if (!expeditions.length) {
    return (
      <section className="expedition-tracker-panel expedition-tracker-panel--empty">
        <h3 className="expedition-tracker-title">Sefer Takip Paneli</h3>
        <p className="expedition-tracker-empty">Yolda aktif sefer yok. Haritadan sefer başlatın.</p>
      </section>
    );
  }

  return (
    <section className="expedition-tracker-panel" aria-label="Sefer takip">
      <div className="expedition-tracker-header">
        <h3 className="expedition-tracker-title">Sefer Takip Paneli</h3>
        <span className="expedition-tracker-count">{expeditions.length} aktif</span>
      </div>
      <ul className="expedition-tracker-list">
        {expeditions.map((e) => (
          <ExpeditionRow key={e.id} expedition={e} />
        ))}
      </ul>
    </section>
  );
}

