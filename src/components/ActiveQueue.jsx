import { useGameStore } from '../stores/gameStore';
import { formatSeconds } from '../lib/gameUtils';

function QueueRow({ item, queued, remainingSeconds, onSpeedUp, onCancel }) {
  const total = item._initialSeconds || remainingSeconds || 1;
  const progress = total > 0 ? ((total - remainingSeconds) / total) * 100 : 100;
  const display = queued ? 'Sırada' : formatSeconds(remainingSeconds);

  return (
    <li className={`active-queue-row${queued ? ' is-queued' : ''}`}>
      <div className="active-queue-row-main">
        <span className="active-queue-label">{item.label}</span>
        {item.detail && <span className="active-queue-detail">{item.detail}</span>}
      </div>
      <span className="active-queue-timer">{display}</span>
      {!queued && (
        <div className="active-queue-progress" aria-hidden="true">
          <div className="active-queue-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      <div className="active-queue-actions">
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
  const queue = useGameStore((s) => {
    const city = s.cities[s.activeCityId];
    return queueType === 'construction' ? city.constructionQueue : city.productionQueue;
  });

  const speedUpConstruction = useGameStore((s) => s.speedUpConstruction);
  const speedUpProduction = useGameStore((s) => s.speedUpProduction);
  const cancelConstruction = useGameStore((s) => s.cancelConstruction);
  const cancelProduction = useGameStore((s) => s.cancelProduction);

  const items = queue.map((q) => ({
    id: q.id,
    label: queueType === 'construction' ? q.name : q.unit,
    detail: queueType === 'construction' ? `Seviye ${q.targetLevel}` : `×${q.count}`,
    remainingSeconds: q.remainingSeconds,
    queued: q.queued,
    _initialSeconds: q._initialSeconds,
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

  return (
    <section className="active-queue-panel">
      <h3 className="active-queue-title">{title}</h3>
      <ul className="active-queue-list">
        {items.map((item) => (
          <QueueRow
            key={item.id}
            item={item}
            queued={item.queued}
            remainingSeconds={item.remainingSeconds}
            onSpeedUp={() => onSpeedUp(item.id)}
            onCancel={() => onCancel(item.id)}
          />
        ))}
      </ul>
    </section>
  );
}


