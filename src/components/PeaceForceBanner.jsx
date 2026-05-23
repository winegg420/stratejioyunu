import { useGameStore } from '../stores/gameStore';
import {
  formatPeaceForceCountdown,
  isPeaceForceProtected,
  PEACE_FORCE_DAYS,
} from '../lib/progressionSystem';
import { useLanguage } from '../context/LanguageContext';
import TerminalLogPanel from './TerminalLogPanel';

export default function PeaceForceBanner() {
  const { t } = useLanguage();
  const protectionEndsAt = useGameStore((s) => s.protectionEndsAt);
  const active = isPeaceForceProtected(protectionEndsAt);
  const countdown = formatPeaceForceCountdown(protectionEndsAt);

  if (!active) return null;

  return (
    <TerminalLogPanel
      title={t('pages.home.peaceForce.panelTitle')}
      tag={t('pages.home.peaceForce.panelTag')}
      className="terminal-log-panel--peace"
    >
      <div className="peace-force-banner" role="status">
        <span className="peace-force-banner__icon" aria-hidden="true">
          🕊️
        </span>
        <div className="peace-force-banner__body">
          <strong className="peace-force-banner__title">{t('pages.home.peaceForce.title')}</strong>
          <p className="peace-force-banner__sub">
            {t('pages.home.peaceForce.body', { days: PEACE_FORCE_DAYS })}
            {countdown && (
              <>
                {' '}
                {t('pages.home.peaceForce.remaining', { time: countdown })}
              </>
            )}
          </p>
          <p className="peace-force-banner__warn">
            {t('pages.home.peaceForce.warn')}
          </p>
        </div>
      </div>
    </TerminalLogPanel>
  );
}
