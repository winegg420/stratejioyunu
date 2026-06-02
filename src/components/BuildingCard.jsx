import { useActionLock } from '../hooks/useActionLock';
import { formatReadableDuration, parseTimeToSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { applyConstructionDurationSeconds } from '../lib/aiCenterEngine';
import { canAffordCost } from '../utils/resourceCosts';
import BuildingRequirementTooltip from './BuildingRequirementTooltip';
import { STORE_EMPTY_ARRAY, useGameStore, useConstructionQueueFull } from '../stores/gameStore';
import {
  BUILDING_LABELS,
} from '../lib/buildingUtils';
import {
  areTutorialPrerequisitesMet,
  getUnmetTutorialPrerequisites,
} from '../lib/milAiTutorialQuests';
import { resolveNextConstructionSpec } from '../data/buildingCatalog';
import {
  AI_CENTER_BUILDING_ID,
  formatAiCenterStatus,
  getAiCenterEnergyDemandHourly,
  getAiCenterLevel,
} from '../lib/aiCenterEngine';
import { resolveBuildingInfoPayload } from '../lib/contentInfoResolver';
import { formatEmpireSlotHint } from '../lib/empireExpansion';
import BuildCountdownHud from './BuildCountdownHud';
import { calcConstructionSpeedupDiamondCost } from '../lib/premiumDiamonds';
import { useLanguage } from '../context/LanguageContext';

export default function BuildingCard({ building, progressionLock = null, coastalLocked = false }) {
  const { t, buildingLabel, lang } = useLanguage();
  const buildingName = buildingLabel(building.id, building.name);
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const playerCities = useGameStore((s) => s.playerCities);
  const cities = useGameStore((s) => s.cities);
  const milAiCompleted = useGameStore((s) => s.milAiCompleted);
  const tutorialState = { activeCityId, cities, milAiCompleted };
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const empireSlotHint = building.id === 'hq'
    ? formatEmpireSlotHint({ playerCities, cities })
    : null;
  const queue = useGameStore((s) => s.cities[s.activeCityId]?.constructionQueue ?? STORE_EMPTY_ARRAY);
  const enqueueConstruction = useGameStore((s) => s.enqueueConstruction);
  const cancelConstruction = useGameStore((s) => s.cancelConstruction);
  const speedUpConstruction = useGameStore((s) => s.speedUpConstruction);
  const diamonds = useGameStore((s) => s.playerMeta?.diamonds ?? 0);
  const openContentInfo = useGameStore((s) => s.openContentInfo);
  const queueFull = useConstructionQueueFull();
  const { locked: actionLocked, runLocked } = useActionLock();

  const queueEntry = queue.find(
    (q) => q.buildingId === building.id || q.name === building.name,
  );
  const active = queue.find((q) => !q.queued && (q.buildingId === building.id || q.name === building.name));
  const upgrading = Boolean(building.upgrading) || Boolean(active);
  const remaining = active ? remainingFromEndsAt(active.endsAt, now) : 0;
  const prereqsMet = areTutorialPrerequisitesMet(city, building.id, tutorialState);
  const unmetPrereqs = getUnmetTutorialPrerequisites(city, building.id, tutorialState);
  const nextSpec = resolveNextConstructionSpec(building);
  const displayCost = nextSpec?.cost ?? null;
  const displayTimeLabel = (() => {
    if (!nextSpec?.time || nextSpec.time === '—') return null;
    const baseSec = parseTimeToSeconds(nextSpec.time);
    if (!baseSec) {
      return /dk|sa|min|hr|sec|sn/i.test(nextSpec.time) ? nextSpec.time : null;
    }
    const adjusted = applyConstructionDurationSeconds(baseSec, city);
    return formatReadableDuration(adjusted, lang);
  })();
  const atMaxLevel = building.maxLevel != null
    && (building.level ?? 0) >= building.maxLevel;
  const canAfford = displayCost && canAffordCost(displayCost, 1, resources);
  const isUnbuilt = building.level < 1;
  const isBlocked = !prereqsMet;
  const progressionBlocked = Boolean(progressionLock);
  const cannotAfford = Boolean(displayCost) && !canAfford && prereqsMet && !progressionBlocked && !coastalLocked;
  const canBuild = Boolean(nextSpec) && !upgrading && canAfford && !queueFull && prereqsMet && !progressionBlocked && !coastalLocked;
  const blockedLabel = unmetPrereqs.length
    ? t('components.buildingCard.sectorLockedReqs', {
      reqs: unmetPrereqs
        .map((req) => t('components.buildingCard.sectorLockedReq', {
          name: (BUILDING_LABELS[req.id] ?? buildingLabel(req.id, req.id)).toUpperCase(),
          level: req.level,
        }))
        .join(' · '),
    })
    : t('components.buildingCard.sectorLockedGeneric');
  const currentLevel = building.level ?? 0;
  const targetLevel = nextSpec?.targetLevel ?? currentLevel + 1;
  const queueBadge = queueEntry
    ? (queueEntry.queued ? t('components.buildingCard.queued') : t('components.buildingCard.upgrading'))
    : null;
  const totalUpgradeSec = active
    ? (active.durationSeconds
      ?? (active.endsAt && active.startedAt
        ? Math.round((active.endsAt - active.startedAt) / 1000)
        : parseTimeToSeconds(nextSpec?.time) || 120))
    : 0;
  const upgradeProgressPct = totalUpgradeSec > 0
    ? Math.min(100, Math.max(0, ((totalUpgradeSec - remaining) / totalUpgradeSec) * 100))
    : 0;
  const speedUpCost = remaining > 0 ? calcConstructionSpeedupDiamondCost(remaining) : 0;
  const canDiamondSpeedUp = upgrading && queueEntry && !queueEntry.queued && remaining > 1;

  const upgradeLabel = queueFull
    ? t('components.buildingCard.queueFull')
    : upgrading
      ? t('components.buildingCard.upgradingEllipsis')
      : !prereqsMet
        ? t('components.buildingCard.prereqMissing')
        : isUnbuilt
          ? t('components.buildingCard.buildCta')
          : t('components.buildingCard.upgrade');

  const handleUpgrade = () => {
    runLocked(() => enqueueConstruction(building.id));
  };
  const handleQueue = () => {
    runLocked(() => enqueueConstruction(building.id, { addToQueue: true }));
  };
  const buildBusy = actionLocked || upgrading;

  const openInfo = () => {
    if (city) openContentInfo(resolveBuildingInfoPayload(building, city));
  };

  const card = (
    <article
      id={`building-card-${building.id}`}
      className={[
        'card',
        'building-card',
        'building-card--steel',
        'content-card--slim',
        upgrading && 'upgrading',
        isBlocked && 'building-card--blocked',
        isUnbuilt && 'building-card--unbuilt',
        isUnbuilt && prereqsMet && 'building-card--starter',
        progressionBlocked && 'building-card--progression-locked',
        cannotAfford && 'building-card--unaffordable',
        coastalLocked && 'building-card--coastal-locked',
        atMaxLevel && 'building-card--max',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="building-lvl-rozet" aria-label={`Seviye ${currentLevel}`}>
        [ LVL {currentLevel} ]
      </span>
      <span className="content-card__intel-badge">[ i ]</span>
      {queueBadge && (
        <span
          className={`building-queue-badge${queueEntry.queued ? ' building-queue-badge--queued' : ' building-queue-badge--active'}`}
        >
          {queueBadge}
        </span>
      )}
      <div className="content-card__stack">
      {coastalLocked && (
        <p className="building-coastal-lock" role="status">
          {t('cityManagement.coastalLock')}
        </p>
      )}
      <button type="button" className="content-card__intel-hit" onClick={openInfo} aria-label={t('components.buildingCard.encyclopediaAria', { name: buildingName })}>
        <div className="card-visual card-visual--building card-visual--placeholder">
          <div
            className={`building-card__placeholder building-card__placeholder--${building.id}`}
            aria-hidden="true"
          >
            <span className="building-card__placeholder-name">{buildingName}</span>
          </div>
        </div>
        <div className="content-card__head">
          <h3>{building.name}</h3>
          <span className="building-level-badge">
            {t('components.buildingCard.levelShort', { level: currentLevel })}
            {nextSpec && currentLevel > 0 && (
              <span className="building-next-level">
                → {t('components.buildingCard.levelShort', { level: targetLevel })}
              </span>
            )}
          </span>
        </div>
      </button>
      {upgrading && (
        <>
          <div className="building-level-progress" aria-hidden={false}>
            <div className="building-level-progress__labels">
              <span>{t('components.buildingCard.levelShort', { level: currentLevel })}</span>
              <span>{t('components.buildingCard.levelShort', { level: targetLevel })}</span>
            </div>
            <div
              className="building-level-progress__bar terminal-progress-track"
              role="progressbar"
              aria-valuenow={Math.round(upgradeProgressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('components.buildingCard.levelProgressAria', { current: currentLevel, target: targetLevel })}
            >
              <div
                className="building-level-progress__fill terminal-progress-fill"
                style={{ width: `${upgradeProgressPct}%` }}
              />
            </div>
          </div>
          <p className="content-card__meta building-upgrade-timer-row">
            <span className="building-upgrade-timer-row__left">
              Kalan: <BuildCountdownHud remaining={remaining} />
            </span>
            {canDiamondSpeedUp && (
              <button
                type="button"
                className="btn-building-speedup"
                title={t('components.buildingCard.speedUpTitle', { cost: speedUpCost })}
                aria-label={t('components.buildingCard.speedUpTitle', { cost: speedUpCost })}
                disabled={diamonds < speedUpCost || actionLocked}
                onClick={() => runLocked(() => speedUpConstruction(queueEntry.id))}
              >
                <span className="btn-building-speedup__icon" aria-hidden="true">⚡</span>
                <span className="btn-building-speedup__cost">{speedUpCost}</span>
                <span className="btn-building-speedup__gem" aria-hidden="true">💎</span>
              </button>
            )}
          </p>
        </>
      )}
      {displayCost ? (
        <p className="content-card__meta">
          {isUnbuilt ? t('components.buildingCard.buildCost') : t('components.buildingCard.upgradeCost')}
          {' '}
          <strong>{displayCost}</strong>
          {displayTimeLabel ? ` · ${displayTimeLabel}` : ''}
        </p>
      ) : atMaxLevel ? (
        <p className="content-card__meta">{t('components.buildingCard.maxLevelReached')}</p>
      ) : (
        <p className="content-card__meta">{t('components.buildingCard.costUndefined')}</p>
      )}
      {building.id === AI_CENTER_BUILDING_ID && getAiCenterLevel(city) >= 1 && (
        <p className="content-card__meta content-card__meta--ai">
          {t('components.buildingCard.aiConsumption', {
            rate: getAiCenterEnergyDemandHourly(getAiCenterLevel(city)),
            status: formatAiCenterStatus(city),
          })}
        </p>
      )}
      {empireSlotHint && (
        <p className="content-card__meta content-card__meta--empire">
          🏛️ {empireSlotHint}
        </p>
      )}
      </div>
      <div className="card-actions">
        {upgrading && queueEntry && (
          <button
            type="button"
            className="btn btn-hud-danger btn-sm building-cancel-btn"
            disabled={actionLocked}
            onClick={() => cancelConstruction(queueEntry.id)}
          >
            {t('components.buildingCard.cancel')}
          </button>
        )}
        {atMaxLevel ? (
          <button
            type="button"
            className="btn btn-hud-primary btn--max-level"
            disabled
            aria-disabled="true"
          >
            {t('components.buildingCard.maxLevelBadge')}
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`btn btn-hud-primary btn-primary${isUnbuilt && prereqsMet ? ' btn-build-start' : ''}${actionLocked ? ' btn-hud-loading' : ''}`}
              disabled={!canBuild || buildBusy || coastalLocked}
              onClick={handleUpgrade}
            >
              {coastalLocked ? t('cityManagement.coastalBtn') : actionLocked ? t('common.loading') : upgradeLabel}
            </button>
            <button
              type="button"
              className={`btn btn-hud-secondary btn-secondary${actionLocked ? ' btn-hud-loading' : ''}`}
              disabled={!canAfford || !prereqsMet || queueFull || actionLocked || coastalLocked}
              onClick={handleQueue}
            >
              {t('components.buildingCard.queueAdd')}
            </button>
          </>
        )}
      </div>
    </article>
  );

  return <BuildingRequirementTooltip building={building}>{card}</BuildingRequirementTooltip>;
}
