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
      <section className="expedition-tracker-panel expedition-tracker-panel--empty panel glass-panel">
        <h3 className="expedition-tracker-title expedition-tracker-title--overlay">
          Sefer Takip Paneli
        </h3>
        <div className="expedition-empty-radar">
          <div className="expedition-empty-radar__scope" aria-hidden="true">
            <span className="expedition-empty-radar__ring" />
            <span className="expedition-empty-radar__ring expedition-empty-radar__ring--mid" />
            <span className="expedition-empty-radar__ring expedition-empty-radar__ring--inner" />
            <span className="expedition-empty-radar__sweep" />
            <span className="expedition-empty-radar__blip" />
          </div>
          <div className="expedition-empty-radar__copy">
            <span className="expedition-empty-radar__tag">[ SEFER YOK ]</span>
            <p className="expedition-empty-radar__title">Yolda aktif sefer yok</p>
            <p className="expedition-empty-radar__hint">
              Harita sekmesinden hedef seçerek saldırı veya keşif seferi başlatın.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="expedition-tracker-panel glass-panel" aria-label="Sefer takip">
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
