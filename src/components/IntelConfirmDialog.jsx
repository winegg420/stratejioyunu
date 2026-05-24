import { useLanguage } from '../context/LanguageContext';
import { getMapCityDisplayName } from '../map/mapCityDisplayName';

export default function IntelConfirmDialog({
  open,
  cityName,
  operationName,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage();
  if (!open) return null;

  const displayCity = getMapCityDisplayName(cityName) || cityName;
  const translated = t('pages.intelligence.sendConfirm', {
    city: displayCity,
    operation: operationName,
  });
  const message = translated.includes('pages.intelligence.sendConfirm')
    ? `${displayCity}'a ${operationName} gönderilecek. Onaylıyor musunuz?`
    : translated;

  return (
    <div className="intel-confirm-root" role="presentation" onClick={onCancel}>
      <div
        className="intel-confirm-dialog hud-panel-border"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="intel-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="intel-confirm-dialog__head">
          <span className="intel-confirm-dialog__tag">[ ONAY GEREKLİ ]</span>
          <h2 id="intel-confirm-title">{t('pages.intelligence.confirmTitle')}</h2>
        </header>
        <p className="intel-confirm-dialog__body">{message}</p>
        <div className="intel-confirm-dialog__actions">
          <button type="button" className="btn btn-hud-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-hud-primary" onClick={onConfirm}>
            {t('pages.intelligence.confirmSend')}
          </button>
        </div>
      </div>
    </div>
  );
}
