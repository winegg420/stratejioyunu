import QueueEmptyState from './QueueEmptyState';
import { useGameStore, getExpeditionOriginLabel } from '../stores/gameStore';
import { formatSeconds, progressFromTiming, remainingFromEndsAt } from '../lib/gameUtils';

const DIRECTION_META = {
  outgoing: { icon: '↗️', label: 'Gidiş' },
  returning: { icon: '↙️', label: 'Dönüş' },
};

function ExpeditionRow({ expedition, now, originLabel, onRecall }) {
  const remaining = remainingFromEndsAt(expedition.endsAt, now);
  const progress = progressFromTiming(expedition.startedAt, expedition.endsAt, now);
  const dir = DIRECTION_META[expedition.direction] || DIRECTION_META.outgoing;
  const isReturn = expedition.direction === 'returning' || expedition.recalled;
  const canRecall = expedition.direction === 'outgoing' && !expedition.recalled;

  const title = isReturn
    ? '[GERİ DÖNÜŞ] Üsse Dönülüyor'
    : expedition.target;
  const targetLabel = isReturn ? originLabel : expedition.target;

  return (
    <li className={`expedition-track-row expedition-track-row--${expedition.direction}${isReturn ? ' expedition-track-row--recall' : ''}`}>
      <div className="expedition-track-main">
        <span className="expedition-track-dir" title={dir.label}>
          {dir.icon}
        </span>
        <div>
          <strong className={isReturn ? 'expedition-track-title-return' : ''}>{title}</strong>
          <span className="expedition-track-origin">
            {isReturn
              ? `Hedef: ${targetLabel}`
              : `${originLabel} → ${expedition.target}`}
          </span>
          {!isReturn && <span className="expedition-track-type">{expedition.type}</span>}
          <span className="expedition-track-troops">{expedition.troops}</span>
        </div>
      </div>
      <span className="expedition-track-timer">{formatSeconds(remaining)}</span>
      {remaining > 0 && (
        <div className="expedition-track-progress" aria-hidden="true">
          <div className="expedition-track-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {canRecall && (
        <button
          type="button"
          className="btn btn-secondary btn-sm expedition-recall-btn"
          onClick={() => onRecall(expedition.id)}
        >
          Geri Çağır
        </button>
      )}
    </li>
  );
}

export default function ExpeditionTrackerPanel() {
  const now = useGameStore((s) => s.now);
  const expeditions = useGameStore((s) => s.expeditions);
  const playerCities = useGameStore((s) => s.playerCities);
  const recallExpedition = useGameStore((s) => s.recallExpedition);

  if (!expeditions.length) {
    return (
      <section className="expedition-tracker-panel expedition-tracker-panel--empty">
        <h3 className="expedition-tracker-title">Sefer Takip Paneli</h3>
        <QueueEmptyState
          as="div"
          tag="[ SEFER YOK ]"
          title="Yolda aktif sefer yok"
          hint="Harita sekmesinden hedef seçerek saldırı veya keşif seferi başlatın."
          icon="⚔"
        />
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
          <ExpeditionRow
            key={e.id}
            expedition={e}
            now={now}
            originLabel={getExpeditionOriginLabel(e, playerCities)}
            onRecall={recallExpedition}
          />
        ))}
      </ul>
    </section>
  );
}
