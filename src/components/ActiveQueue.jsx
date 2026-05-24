import { useMemo } from 'react';
import { landUnits, airUnits, seaUnits } from '../data/placeholder';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { formatSeconds, progressFromTiming, remainingFromEndsAt } from '../lib/gameUtils';
import { calcConstructionSpeedupDiamondCost } from '../lib/premiumDiamonds';
import { resolveUnitIconDomain } from './UnitMilitaryIcon';
import UnitMilitaryIcon from './UnitMilitaryIcon';
import { useLanguage } from '../context/LanguageContext';
import CyberTerminalPlaceholder from './CyberTerminalPlaceholder';
import TerminalLogPanel from './TerminalLogPanel';

const ALL_UNITS = [...landUnits, ...airUnits, ...seaUnits];

function QueueRow({
  item, queued, remaining, progress, onSpeedUp, onCancel, onStart, productionHud,
  speedUpCost, canAffordSpeedUp, speedUpTitle, unitId, iconDomain, t,
}) {
  const display = queued ? t('components.activeQueue.queued') : formatSeconds(remaining);

  if (productionHud) {
    return (
      <li className={`production-queue-hud${queued ? ' production-queue-hud--queued' : ''}`}>
        <span className="production-queue-hud__thumb" aria-hidden="true">
          {unitId ? (
            <UnitMilitaryIcon unitId={unitId} domain={iconDomain} size={28} />
          ) : (
            item.unitImage ?? '⚔️'
          )}
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
              {t('components.activeQueue.start')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-speedup btn-speedup--diamond btn-sm"
              title={speedUpTitle}
              disabled={!canAffordSpeedUp}
              onClick={onSpeedUp}
            >
              <span aria-hidden="true">⚡</span>
              <span className="btn-speedup__cost">{speedUpCost}</span>
              <span aria-hidden="true">💎</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            {t('components.activeQueue.cancel')}
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
            {t('components.activeQueue.start')}
          </button>
        )}
        {!queued && (
          <button
            type="button"
            className="btn btn-speedup btn-speedup--diamond btn-sm"
            title={speedUpTitle}
            disabled={!canAffordSpeedUp}
            onClick={onSpeedUp}
          >
            <span aria-hidden="true">⚡</span>
            <span className="btn-speedup__cost">{speedUpCost}</span>
            <span aria-hidden="true">💎</span>
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          {t('components.activeQueue.cancel')}
        </button>
      </div>
    </li>
  );
}

export default function ActiveQueue({ title, queueType, emptyText }) {
  const { t, unitName } = useLanguage();
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
  const diamonds = useGameStore((s) => s.playerMeta?.diamonds ?? 0);
  const hasActive = queue.some((q) => !q.queued);

  const isProduction = queueType === 'production';

  const activeProduction = useMemo(() => {
    if (!isProduction || !queue.length) return null;
    const q = queue.find((entry) => !entry.queued) ?? queue[0];
    if (!q) return null;
    const label = unitName(q.unitId, q.unit) || q.unit || q.unitId;
    const rem = q.queued ? 0 : remainingFromEndsAt(q.endsAt, now);
    const time = q.queued
      ? t('components.activeQueue.queued')
      : formatSeconds(rem);
    return {
      ...q,
      label,
      time,
      iconDomain: resolveUnitIconDomain(q.unitId),
    };
  }, [isProduction, queue, now, t, unitName]);

  const dockTitle = activeProduction
    ? t('components.activeQueue.productionDock', {
      unit: activeProduction.label,
      count: activeProduction.count,
      time: activeProduction.time,
    })
    : title;

  const items = queue.map((q) => {
    const unitMeta = isProduction ? ALL_UNITS.find((u) => u.id === q.unitId) : null;
    const rem = q.queued ? 0 : remainingFromEndsAt(q.endsAt, now);
    const speedUpCost = !isProduction && !q.queued && rem > 1
      ? calcConstructionSpeedupDiamondCost(rem)
      : 0;
    const unitLabel = unitName(q.unitId, q.unit) || q.unit || q.unitId;
    return {
      id: q.id,
      unitId: q.unitId,
      iconDomain: resolveUnitIconDomain(q.unitId),
      label: queueType === 'construction' ? q.name : unitLabel,
      detail: queueType === 'construction'
        ? t('components.activeQueue.levelDetail', { level: q.targetLevel })
        : t('components.activeQueue.unitQty', { count: q.count }),
      unitImage: unitMeta?.image,
      queued: q.queued,
      remaining: rem,
      progress: q.queued ? 0 : progressFromTiming(q.startedAt, q.endsAt, now),
      speedUpCost,
      canAffordSpeedUp: isProduction || speedUpCost === 0 || diamonds >= speedUpCost,
      speedUpTitle: isProduction
        ? t('components.activeQueue.speedUp')
        : t('components.activeQueue.speedUpConstruction', { cost: speedUpCost }),
    };
  });

  const dockTag = queueType === 'construction'
    ? t('components.activeQueue.construction')
    : t('components.activeQueue.production');

  if (!items.length) {
    return (
      <TerminalLogPanel title={title} tag={dockTag} className="terminal-log-panel--queue">
        <section className="active-queue-panel active-queue-panel--empty active-queue-panel--placeholder">
          <h3 className="active-queue-title">{title}</h3>
          <CyberTerminalPlaceholder variant="standby" />
        </section>
      </TerminalLogPanel>
    );
  }

  const onSpeedUp = queueType === 'construction' ? speedUpConstruction : speedUpProduction;
  const onCancel = queueType === 'construction' ? cancelConstruction : cancelProduction;
  const onStartQueued = queueType === 'construction' ? startQueuedConstruction : startQueuedProduction;

  return (
    <TerminalLogPanel title={dockTitle} tag={dockTag} className="terminal-log-panel--queue">
      <section className="active-queue-panel">
        <h3 className="active-queue-title">
          {activeProduction
            ? t('components.activeQueue.productionTitle', {
              unit: activeProduction.label,
              count: activeProduction.count,
            })
            : title}
        </h3>
        <ul className={`active-queue-list${isProduction ? ' active-queue-list--production' : ''}`}>
          {items.map((item) => (
            <QueueRow
              key={item.id}
              item={item}
              unitId={item.unitId}
              iconDomain={item.iconDomain}
              queued={item.queued}
              remaining={item.remaining}
              progress={item.progress}
              productionHud={isProduction}
              speedUpCost={item.speedUpCost}
              canAffordSpeedUp={item.canAffordSpeedUp}
              speedUpTitle={item.speedUpTitle}
              t={t}
              onSpeedUp={() => onSpeedUp(item.id)}
              onCancel={() => onCancel(item.id)}
              onStart={() => !hasActive && onStartQueued(item.id)}
            />
          ))}
        </ul>
      </section>
    </TerminalLogPanel>
  );
}
