import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { DIAMOND_STORE_PACKAGES } from '../lib/premiumDiamonds';
import { formatCompactNumber } from '../lib/formatNumber';
import { useGameStore } from '../stores/gameStore';

export default function DiamondPackagesModal({ open, onClose }) {
  const { t } = useLanguage();
  const diamonds = useGameStore((s) => s.playerMeta?.diamonds ?? 0);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="diamond-shop-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diamond-shop-title"
      onClick={onClose}
    >
      <div
        className="diamond-shop-modal glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="diamond-shop-modal__head">
          <div>
            <p className="diamond-shop-modal__eyebrow">[ PREMIUM KOMUTA ]</p>
            <h2 id="diamond-shop-title">{t('premium.shopTitle')}</h2>
            <p className="diamond-shop-modal__balance">
              {t('premium.balance', { count: formatCompactNumber(diamonds) })}
            </p>
          </div>
          <button
            type="button"
            className="hud-modal-close diamond-shop-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            [ X ]
          </button>
        </header>

        <p className="diamond-shop-modal__hint">{t('premium.shopHint')}</p>

        <ul className="diamond-shop-packages">
          {DIAMOND_STORE_PACKAGES.map((pack) => (
            <li
              key={pack.id}
              className={[
                'diamond-shop-pack',
                pack.featured && 'diamond-shop-pack--featured',
              ].filter(Boolean).join(' ')}
            >
              <span className="diamond-shop-pack__gem" aria-hidden="true">💎</span>
              <div className="diamond-shop-pack__body">
                <strong className="diamond-shop-pack__name">{t(pack.labelKey)}</strong>
                <span className="diamond-shop-pack__amount font-hud-data">
                  +{formatCompactNumber(pack.diamonds)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-hud-primary btn-sm diamond-shop-pack__cta"
                disabled
                title={t('premium.comingSoon')}
              >
                {t('premium.comingSoon')}
              </button>
            </li>
          ))}
        </ul>

        <footer className="diamond-shop-modal__foot">
          <p>{t('premium.shopFoot')}</p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
