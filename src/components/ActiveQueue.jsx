import { landUnits, airUnits, seaUnits } from '../data/placeholder';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { formatSeconds, progressFromTiming, remainingFromEndsAt } from '../lib/gameUtils';
import QueueEmptyState from './QueueEmptyState';

const ALL_UNITS = [...landUnits, ...airUnits, ...seaUnits];

function QueueRow({ item, queued, remaining, progress, onSpeedUp, onCancel, onStart, productionHud }) {
  const display = queued ? 'Sırada' : formatSeconds(remaining);

  if (productionHud) {
    return (
      <li className={`production-queue-hud${queued ? ' production-queue-hud--queued' : ''}`}>
        <span className="production-queue-hud__thumb" aria-hidden="true">
          {item.unitImage ?? '⚔️'}
        </span>
        <div className="production-queue-hud__body">
          <span className="production-queue-hud__label">{item.label}</span>
          <span className="production-queue-hud__detail">{item.detail}</span>
          <div className="production-queue-hud__bar" aria-hidden="true">
            <div className="production-queue-hud__fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="production-queue-hud__timer font-hud-data">{display}</span>
        </div>
        <div className="active-queue-actions">
          {queued ? (
            <button type="button" className="btn btn-primary btn-sm" disabled={!onStart} onClick={onStart}>
              Başlat
            </button>
          ) : (
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
    if (!city) return STORE_EMPTY_ARRAY;
    return queueType === 'construction'
      ? (city.constructionQueue ?? STORE_EMPTY_ARRAY)
      : (city.productionQueue ?? STORE_EMPTY_ARRAY);
  });

  const speedUpConstruction = useGameStore((s) => s.speedUpConstruction);
  const speedUpProduction = useGameStore((s) => s.speedUpProduction);
  const cancelConstruction = useGameStore((s) => s.cancelConstruction);
  const cancelProduction = useGameStore((s) => s.cancelProduction);
  const startQueuedConstruction = useGameStore((s) => s.startQueuedConstruction);
  const startQueuedProduction = useGameStore((s) => s.startQueuedProduction);
  const hasActive = queue.some((q) => !q.queued);

  const isProduction = queueType === 'production';

  const items = queue.map((q) => {
    const unitMeta = isProduction ? ALL_UNITS.find((u) => u.id === q.unitId) : null;
    return {
      id: q.id,
      label: queueType === 'construction' ? q.name : q.unit,
      detail: queueType === 'construction' ? `Seviye ${q.targetLevel}` : `×${q.count}`,
      unitImage: unitMeta?.image,
      queued: q.queued,
      remaining: q.queued ? 0 : remainingFromEndsAt(q.endsAt, now),
      progress: q.queued ? 0 : progressFromTiming(q.startedAt, q.endsAt, now),
    };
  });

  if (!items.length) {
    const isConstruction = queueType === 'construction';
    return (
      <section className="active-queue-panel active-queue-panel--empty active-queue-panel--placeholder">
        <h3 className="active-queue-title">{title}</h3>
        <QueueEmptyState
          as="div"
          tag={isConstruction ? '[ İNŞAAT ALANI BOŞ ]' : '[ ÜRETİM KUYRUĞU BOŞ ]'}
          icon={isConstruction ? '🏗️' : '⚔️'}
          title={isConstruction ? 'Sistem hazır — kuyruk bekliyor' : 'Üretim bekliyor'}
          hint={
            isConstruction
              ? 'Aşağıdan bir bina seçerek yükseltme kuyruğuna ekleyebilirsiniz.'
              : emptyText || 'Bir birlik seçip üretim başlatabilirsiniz.'
          }
        />
      </section>
    );
  }

  const onSpeedUp = queueType === 'construction' ? speedUpConstruction : speedUpProduction;
  const onCancel = queueType === 'construction' ? cancelConstruction : cancelProduction;
  const onStartQueued = queueType === 'construction' ? startQueuedConstruction : startQueuedProduction;

  return (
    <section className="active-queue-panel">
      <h3 className="active-queue-title">{title}</h3>
      <ul className={`active-queue-list${isProduction ? ' active-queue-list--production' : ''}`}>
        {items.map((item) => (
          <QueueRow
            key={item.id}
            item={item}
            queued={item.queued}
            remaining={item.remaining}
            progress={item.progress}
            productionHud={isProduction}
            onSpeedUp={() => onSpeedUp(item.id)}
            onCancel={() => onCancel(item.id)}
            onStart={() => !hasActive && onStartQueued(item.id)}
          />
        ))}
      </ul>
    </section>
  );
}
