import { useGameStore, getExpeditionOriginLabel } from '../stores/gameStore';
import { formatSeconds, progressFromTiming, remainingFromEndsAt } from '../lib/gameUtils';
import { useLanguage } from '../context/LanguageContext';

function ExpeditionRow({ expedition, now, originLabel, onRecall, t }) {
  const remaining = remainingFromEndsAt(expedition.endsAt, now);
  const progress = progressFromTiming(expedition.startedAt, expedition.endsAt, now);
  const isReturn = expedition.direction === 'returning' || expedition.recalled;
  const canRecall = expedition.direction === 'outgoing' && !expedition.recalled;
  const dirIcon = isReturn ? '↙️' : '↗️';
  const dirLabel = isReturn
    ? t('pages.home.expedition.directionReturning')
    : t('pages.home.expedition.directionOutgoing');

  const title = isReturn
    ? t('pages.home.expedition.returningTitle')
    : expedition.target;
  const targetLabel = isReturn ? originLabel : expedition.target;

  return (
    <li className={`expedition-track-row expedition-track-row--${expedition.direction}${isReturn ? ' expedition-track-row--recall' : ''}`}>
      <div className="expedition-track-main">
        <span className="expedition-track-dir" title={dirLabel}>
          {dirIcon}
        </span>
        <div>
          <strong className={isReturn ? 'expedition-track-title-return' : ''}>{title}</strong>
          <span className="expedition-track-origin">
            {isReturn
              ? t('pages.home.expedition.targetLabel', { name: targetLabel })
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
          {t('pages.home.expedition.recall')}
        </button>
      )}
    </li>
  );
}

export default function ExpeditionTrackerPanel() {
  const { t } = useLanguage();
  const now = useGameStore((s) => s.now);
  const expeditions = useGameStore((s) => s.expeditions);
  const playerCities = useGameStore((s) => s.playerCities);
  const recallExpedition = useGameStore((s) => s.recallExpedition);

  if (!expeditions.length) {
    return (
      <section className="expedition-tracker-panel expedition-tracker-panel--empty panel glass-panel">
        <h3 className="expedition-tracker-title expedition-tracker-title--overlay">
          {t('pages.home.expedition.title')}
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
            <span className="expedition-empty-radar__tag">{t('pages.home.expedition.emptyTag')}</span>
            <p className="expedition-empty-radar__title">{t('pages.home.expedition.emptyTitle')}</p>
            <p className="expedition-empty-radar__hint">{t('pages.home.expedition.emptyHint')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="expedition-tracker-panel glass-panel" aria-label={t('pages.home.expedition.aria')}>
      <div className="expedition-tracker-header">
        <h3 className="expedition-tracker-title">{t('pages.home.expedition.title')}</h3>
        <span className="expedition-tracker-count">
          {t('pages.home.expedition.activeCount', { count: expeditions.length })}
        </span>
      </div>
      <ul className="expedition-tracker-list">
        {expeditions.map((e) => (
          <ExpeditionRow
            key={e.id}
            expedition={e}
            now={now}
            originLabel={getExpeditionOriginLabel(e, playerCities)}
            onRecall={recallExpedition}
            t={t}
          />
        ))}
      </ul>
    </section>
  );
}
