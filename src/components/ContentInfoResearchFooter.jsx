import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { canAffordCost } from '../utils/resourceCosts';
import { ADVANCED_RESEARCH_CATEGORY } from '../data/researchCatalog';
import { isKbrnBranchUnlocked, scaleAdvancedResearchCost } from '../lib/kbrnResearch';
import { useLanguage } from '../context/LanguageContext';

export default function ContentInfoResearchFooter({ researchId, onClose }) {
  const { t, researchName } = useLanguage();
  const city = useActiveCity();
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

  const handleResearch = () => {
    if (item.queued) {
      const ok = startQueuedResearch(item.id);
      if (!ok) {
        useNotificationStore.getState().addToast(t('pages.research.startFailed'), 'warn');
      } else {
        onClose?.();
      }
      return;
    }
    const ok = enqueueResearch(item.id);
    if (!ok) {
      useNotificationStore.getState().addToast(t('pages.research.startFailed'), 'warn');
    } else {
      onClose?.();
    }
  };

  const handleQueue = () => {
    const ok = enqueueResearch(item.id, { addToQueue: true });
    if (!ok) {
      useNotificationStore.getState().addToast(t('pages.research.queueFailed'), 'warn');
    }
  };

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
            onClick={() => {
              useNotificationStore.getState().addToast(t('pages.research.maxLevelReached'), 'info');
            }}
          >
            {t('pages.research.maxLevel')}
          </button>
        ) : item.queued ? (
          <button
            type="button"
            className="btn btn-hud-primary"
            disabled={hasActive || advancedLocked}
            onClick={handleResearch}
          >
            {t('pages.research.start')}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-hud-primary"
            disabled={!canStart}
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
