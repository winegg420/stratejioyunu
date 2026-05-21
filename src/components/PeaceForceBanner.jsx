import { useGameStore } from '../stores/gameStore';
import {
  formatPeaceForceCountdown,
  isPeaceForceProtected,
  PEACE_FORCE_DAYS,
} from '../lib/progressionSystem';

export default function PeaceForceBanner() {
  const protectionEndsAt = useGameStore((s) => s.protectionEndsAt);
  const active = isPeaceForceProtected(protectionEndsAt);
  const countdown = formatPeaceForceCountdown(protectionEndsAt);

  if (!active) return null;

  return (
    <div className="peace-force-banner" role="status">
      <span className="peace-force-banner__icon" aria-hidden="true">
        🕊️
      </span>
      <div className="peace-force-banner__body">
        <strong className="peace-force-banner__title">[ BARIŞ GÜCÜ KORUMASI AKTİF ]</strong>
        <p className="peace-force-banner__sub">
          {PEACE_FORCE_DAYS} günlük diplomatik muafiyet — saldırı, siber ve KBRN size uygulanamaz.
          {countdown && (
            <>
              {' '}
              Kalan: <span className="font-hud-data">{countdown}</span>
            </>
          )}
        </p>
        <p className="peace-force-banner__warn">
          Koruma süresi bitmiş bir oyuncuya saldırı başlatırsanız kalkan anında düşer.
        </p>
      </div>
    </div>
  );
}
