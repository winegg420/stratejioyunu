import { useLanguage } from '../context/LanguageContext';
import { useGameStore } from '../stores/gameStore';
import { formatSeconds, progressFromTiming, remainingFromEndsAt } from '../lib/gameUtils';
import { DEFENSE_BY_ID } from '../data/defenseCatalog';

export default function DefenseQueuePanel({ cityName, queue = [] }) {
  const { t } = useLanguage();
  const now = useGameStore((s) => s.now);
  const startQueuedDefense = useGameStore((s) => s.startQueuedDefense);
  const cancelDefenseQueue = useGameStore((s) => s.cancelDefenseQueue);

  if (!queue.length) {
    return (
      <section className="defense-queue-section" aria-labelledby="defense-queue-heading">
        <h2 id="defense-queue-heading" className="defense-section-title">
          {t('pages.defense.queueTitle', { city: cityName ?? '—' })}
        </h2>
        <p className="defense-queue-empty">{t('pages.defense.queueEmpty')}</p>
      </section>
    );
  }

  return (
    <section className="defense-queue-section" aria-labelledby="defense-queue-heading">
      <h2 id="defense-queue-heading" className="defense-section-title">
        {t('pages.defense.queueTitle', { city: cityName ?? '—' })}
      </h2>
      <ul className="defense-queue-list">
        {queue.map((item) => {
          const def = DEFENSE_BY_ID[item.systemId];
          const remaining = item.queued ? null : remainingFromEndsAt(item.endsAt, now);
          const progress = item.queued ? 0 : progressFromTiming(item, now);
          const label = item.kind === 'upgrade'
            ? t('pages.defense.queueUpgradeLabel', { name: def?.name ?? item.label })
            : t('pages.defense.queueProduceLabel', { count: item.count, name: def?.name ?? item.label });

          return (
            <li key={item.id} className={`defense-queue-item${item.queued ? ' defense-queue-item--queued' : ''}`}>
              <span className="defense-queue-item__icon" aria-hidden="true">{def?.icon ?? '🛡️'}</span>
              <div className="defense-queue-item__body">
                <span className="defense-queue-item__label">{label}</span>
                <div className="defense-queue-item__bar" aria-hidden="true">
                  <span className="defense-queue-item__fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="defense-queue-item__timer font-hud-data">
                  {item.queued ? t('pages.defense.queued') : formatSeconds(remaining)}
                </span>
              </div>
              <div className="defense-queue-item__actions">
                {item.queued ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => startQueuedDefense(item.id)}>
                    {t('pages.defense.queueStart')}
                  </button>
                ) : null}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => cancelDefenseQueue(item.id)}>
                  {t('pages.defense.queueCancel')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
