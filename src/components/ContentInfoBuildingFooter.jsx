import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { canAffordCost } from '../utils/resourceCosts';
import { resolveNextConstructionSpec } from '../data/buildingCatalog';
import { parseTimeToSeconds, formatReadableDuration } from '../lib/gameUtils';
import { applyConstructionDurationSeconds } from '../lib/aiCenterEngine';
import {
  areTutorialPrerequisitesMet,
} from '../lib/milAiTutorialQuests';
import { flushGameSave } from '../lib/gameActionSync';
import { CONSTRUCTION_QUEUE_LIMIT } from '../lib/gameConstants';
import { useLanguage } from '../context/LanguageContext';

export default function ContentInfoBuildingFooter({ buildingId, onClose }) {
  const { t, buildingLabel, lang } = useLanguage();
  const city = useActiveCity();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const milAiCompleted = useGameStore((s) => s.milAiCompleted);
  const cities = useGameStore((s) => s.cities);
  const queue = useGameStore((s) => s.cities[s.activeCityId]?.constructionQueue ?? STORE_EMPTY_ARRAY);
  const enqueueConstruction = useGameStore((s) => s.enqueueConstruction);
  const constructionQueueFull = useGameStore(
    (s) => (s.cities[s.activeCityId]?.constructionQueue?.length ?? 0) >= CONSTRUCTION_QUEUE_LIMIT,
  );

  const building = city?.buildings?.find((b) => b.id === buildingId);
  if (!building) return null;

  const displayName = buildingLabel(building.id, building.name);
  const tutorialState = { activeCityId, cities, milAiCompleted };
  const nextSpec = resolveNextConstructionSpec(building);
  const atMaxLevel = building.maxLevel != null
    && (building.level ?? 0) >= building.maxLevel;
  const isUnbuilt = (building.level ?? 0) < 1;
  const prereqsMet = areTutorialPrerequisitesMet(city, building.id, tutorialState);
  const upgrading = queue.some(
    (q) => !q.queued && (q.buildingId === building.id || q.name === building.name),
  );
  const queued = queue.some(
    (q) => q.queued && (q.buildingId === building.id || q.name === building.name),
  );
  const displayCost = nextSpec?.cost ?? null;
  const displayTimeSec = nextSpec?.time
    ? applyConstructionDurationSeconds(parseTimeToSeconds(nextSpec.time) || 120, city)
    : 0;
  const displayTimeLabel = displayTimeSec > 0
    ? formatReadableDuration(displayTimeSec, lang)
    : null;
  const canAfford = displayCost && canAffordCost(displayCost, 1, resources);
  const canBuild = Boolean(nextSpec) && canAfford && prereqsMet && !upgrading && !constructionQueueFull;

  const persistBuild = async (ok) => {
    if (!ok) {
      useNotificationStore.getState().addToast(t('components.buildingCard.prereqMissing'), 'warn');
      return;
    }
    await flushGameSave({ cityId: activeCityId });
    onClose?.();
  };

  const handleBuild = async () => {
    if (atMaxLevel) {
      useNotificationStore.getState().addToast(t('components.buildingCard.maxLevelReached'), 'info');
      return;
    }
    if (!prereqsMet) {
      useNotificationStore.getState().addToast(t('components.buildingCard.prereqMissing'), 'warn');
      return;
    }
    if (!canAfford) {
      useNotificationStore.getState().addToast(t('components.buildingCard.cannotAfford'), 'warn');
      return;
    }
    if (constructionQueueFull) {
      useNotificationStore.getState().addToast(t('components.buildingCard.queueFull'), 'warn');
      return;
    }
    if (upgrading) {
      useNotificationStore.getState().addToast(t('components.buildingCard.upgradingEllipsis'), 'info');
      return;
    }
    const ok = enqueueConstruction(building.id);
    await persistBuild(ok);
  };

  const handleQueue = async () => {
    if (atMaxLevel || !canAfford || !prereqsMet || constructionQueueFull) {
      handleBuild();
      return;
    }
    const ok = enqueueConstruction(building.id, { addToQueue: true });
    await persistBuild(ok);
  };

  return (
    <footer className="content-info-modal__footer content-info-modal__footer--building">
      {!atMaxLevel && displayCost && (
        <p className="content-info-modal__footer-meta">
          {isUnbuilt ? t('components.buildingCard.buildCost') : t('components.buildingCard.upgradeCost')}
          {' '}
          <strong>{displayCost}</strong>
          {displayTimeLabel ? ` · ${displayTimeLabel}` : ''}
        </p>
      )}
      <div className="content-info-modal__footer-actions">
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
              className="btn btn-hud-primary"
              disabled={!canBuild}
              onClick={handleBuild}
            >
              {upgrading
                ? t('components.buildingCard.upgradingEllipsis')
                : isUnbuilt
                  ? t('components.buildingCard.buildCta')
                  : t('components.buildingCard.upgrade')}
            </button>
            <button
              type="button"
              className="btn btn-hud-secondary"
              disabled={!canAfford || !prereqsMet || constructionQueueFull || upgrading}
              onClick={handleQueue}
            >
              {t('components.buildingCard.queueAdd')}
            </button>
          </>
        )}
      </div>
      <p className="content-info-modal__footer-hint">
        {displayName}
        {queued && !upgrading && ` · ${t('components.buildingCard.queued')}`}
        {upgrading && ` · ${t('components.buildingCard.upgradingEllipsis')}`}
      </p>
    </footer>
  );
}
