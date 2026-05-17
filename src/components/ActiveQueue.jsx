import { useGameStore } from '../stores/gameStore';
import { formatSeconds, progressFromTiming, remainingFromEndsAt } from '../lib/gameUtils';

function QueueRow({ item, queued, remaining, progress, onSpeedUp, onCancel, onStart }) {
  const display = queued ? 'Sırada' : formatSeconds(remaining);

  return (
    <li className={`active-queue-row${queued ? ' is-queued' : ''}`}>
      <div className="active-queue-row-main">
        <span className="active-queue-label">{item.label}</span>
        {item.detail && <span className="active-queue-detail">{item.detail}</span>}
      </div>
      <span className="active-queue-timer">{display}</span>
      {!queued && (
        <div className="active-queue-progress" aria-hidden="true">
          <div className="active-queue-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="active-queue-actions">
        {queued && (
          <button type="button" className="btn btn-primary btn-sm" disabled={!onStart} onClick={onStart}>
            Başlat
          </button>
        )}
        {!queued && (
          <button type="button" className="btn btn-speedup btn-sm" onClick={onSpeedUp}>
            Hızlandır
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          İptal
        </button>
      </div>
    </li>
  );
}

export default function ActiveQueue({ title, queueType, emptyText }) {
  const now = useGameStore((s) => s.now);
  const queue = useGameStore((s) => {
    const city = s.cities[s.activeCityId];
    if (!city) return [];
    return queueType === 'construction'
      ? (city.constructionQueue ?? [])
      : (city.productionQueue ?? []);
  });

  const speedUpConstruction = useGameStore((s) => s.speedUpConstruction);
  const speedUpProduction = useGameStore((s) => s.speedUpProduction);
  const cancelConstruction = useGameStore((s) => s.cancelConstruction);
  const cancelProduction = useGameStore((s) => s.cancelProduction);
  const startQueuedConstruction = useGameStore((s) => s.startQueuedConstruction);
  const startQueuedProduction = useGameStore((s) => s.startQueuedProduction);
  const hasActive = queue.some((q) => !q.queued);

  const items = queue.map((q) => ({
    id: q.id,
    label: queueType === 'construction' ? q.name : q.unit,
    detail: queueType === 'construction' ? `Seviye ${q.targetLevel}` : `×${q.count}`,
    queued: q.queued,
    remaining: q.queued ? 0 : remainingFromEndsAt(q.endsAt, now),
    progress: q.queued ? 0 : progressFromTiming(q.startedAt, q.endsAt, now),
  }));

  if (!items.length) {
    return (
      <section className="active-queue-panel active-queue-panel--empty">
        <h3 className="active-queue-title">{title}</h3>
        <p className="active-queue-empty">{emptyText}</p>
      </section>
    );
  }

  const onSpeedUp = queueType === 'construction' ? speedUpConstruction : speedUpProduction;
  const onCancel = queueType === 'construction' ? cancelConstruction : cancelProduction;
  const onStartQueued = queueType === 'construction' ? startQueuedConstruction : startQueuedProduction;

  return (
    <section className="active-queue-panel">
      <h3 className="active-queue-title">{title}</h3>
      <ul className="active-queue-list">
        {items.map((item) => (
          <QueueRow
            key={item.id}
            item={item}
            queued={item.queued}
            remaining={item.remaining}
            progress={item.progress}
            onSpeedUp={() => onSpeedUp(item.id)}
            onCancel={() => onCancel(item.id)}
            onStart={() => !hasActive && onStartQueued(item.id)}
          />
        ))}
      </ul>
    </section>
  );
}
