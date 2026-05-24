import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { canAffordCost } from '../utils/resourceCosts';
import { ADVANCED_RESEARCH_CATEGORY } from '../data/researchCatalog';
import { isKbrnBranchUnlocked, scaleAdvancedResearchCost } from '../lib/kbrnResearch';
import { flushGameSave } from '../lib/gameActionSync';
import { useLanguage } from '../context/LanguageContext';

export default function ContentInfoResearchFooter({ researchId, onClose }) {
  const { t, researchName } = useLanguage();
  const city = useActiveCity();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const enqueueResearch = useGameStore((s) => s.enqueueResearch);
  const startQueuedResearch = useGameStore((s) => s.startQueuedResearch);
  const cancelResearch = useGameStore((s) => s.cancelResearch);

  const item = researches.find((r) => r.id === researchId);
  if (!item) return null;

  const displayName = researchName(item.id, item.name);
  const isAdvanced = item.category === ADVANCED_RESEARCH_CATEGORY || item.category === 'kbrn';
  const displayCost = scaleAdvancedResearchCost(item.cost, item.level ?? 0, item.category);
  const advancedLocked = isAdvanced && !isKbrnBranchUnlocked(city);
  const hasActive = researches.some((r) => r.active);
  const atMaxLevel = (item.level ?? 0) >= (item.max ?? 15);
  const canAfford = !atMaxLevel && displayCost !== '—' && canAffordCost(displayCost, 1, resources);
  const canStart = !atMaxLevel && !advancedLocked && !item.active && !item.queued && canAfford && !hasActive;
  const canQueue = !atMaxLevel && !advancedLocked && !item.active && !item.queued && canAfford && hasActive;

  const persistResearch = async (ok) => {
    if (!ok) {
      useNotificationStore.getState().addToast(t('pages.research.startFailed'), 'warn');
      return;
    }
    await flushGameSave({ cityId: activeCityId, researches: true });
    onClose?.();
  };

  const toast = (key, type = 'warn') => {
    useNotificationStore.getState().addToast(t(key), type);
  };

  const handleResearch = async () => {
    if (atMaxLevel) {
      toast('pages.research.maxLevelReached', 'info');
      return;
    }
    if (advancedLocked) {
      toast('pages.research.lockHint');
      return;
    }
    if (item.active) {
      toast('pages.research.researching', 'info');
      return;
    }
    if (!canAfford) {
      toast('pages.research.cannotAfford');
      return;
    }

    if (item.queued) {
      if (hasActive) {
        toast('pages.research.waitForActive');
        return;
      }
      const ok = startQueuedResearch(item.id);
      await persistResearch(ok);
      return;
    }

    if (hasActive) {
      const ok = enqueueResearch(item.id, { addToQueue: true });
      if (!ok) {
        toast('pages.research.queueFailed');
        return;
      }
      await flushGameSave({ cityId: activeCityId, researches: true });
      onClose?.();
      return;
    }

    const ok = enqueueResearch(item.id);
    await persistResearch(ok);
  };

  const handleQueue = async () => {
    const ok = enqueueResearch(item.id, { addToQueue: true });
    if (!ok) {
      useNotificationStore.getState().addToast(t('pages.research.queueFailed'), 'warn');
      return;
    }
    await flushGameSave({ cityId: activeCityId, researches: true });
  };

  const primaryDisabled = item.queued
    ? hasActive || advancedLocked
    : !canStart && !canQueue;

  return (
    <footer className="content-info-modal__footer content-info-modal__footer--research">
      {!advancedLocked && !atMaxLevel && displayCost !== '—' && (
        <p className="content-info-modal__footer-meta">
          {t('pages.research.cost')} <strong>{displayCost}</strong>
        </p>
      )}
      <div className="content-info-modal__footer-actions">
        {atMaxLevel ? (
          <button
            type="button"
            className="btn btn-hud-primary btn--research-max"
            disabled
            aria-disabled="true"
          >
            {t('pages.research.maxLevel')}
          </button>
        ) : item.queued ? (
          <button
            type="button"
            className={`btn btn-hud-primary${primaryLooksDisabled ? ' btn--action-muted' : ''}`}
            aria-disabled={primaryLooksDisabled || undefined}
            onClick={handleResearch}
          >
            {t('pages.research.start')}
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn-hud-primary${primaryLooksDisabled ? ' btn--action-muted' : ''}`}
            aria-disabled={primaryLooksDisabled || undefined}
            onClick={handleResearch}
          >
            {item.active ? t('pages.research.researching') : t('pages.research.research')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-hud-secondary"
          disabled={!canQueue || item.active || item.queued || advancedLocked}
          onClick={handleQueue}
        >
          {t('common.queueAdd')}
        </button>
        {(item.active || item.queued) && (
          <button
            type="button"
            className="btn btn-hud-secondary btn-sm"
            onClick={() => cancelResearch(item.id)}
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
      <p className="content-info-modal__footer-hint">
        {displayName}
        {item.active && ` · ${t('pages.research.researching')}`}
        {item.queued && !item.active && ` · ${t('pages.research.queued')}`}
      </p>
    </footer>
  );
}
