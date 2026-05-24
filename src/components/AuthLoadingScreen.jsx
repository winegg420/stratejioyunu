import { useLanguage } from '../context/LanguageContext';

/** Ortak oturum / senkron bekleme ekranı */
export default function AuthLoadingScreen({
  messageKey = 'auth.checking',
  timedOut = false,
  onReload,
}) {
  const { t } = useLanguage();

  return (
    <div className="auth-loading-screen" aria-live="polite">
      <p>{t(messageKey)}</p>
      {timedOut ? (
        <>
          <p className="auth-loading-screen__error">
            {messageKey === 'auth.checking' ? t('auth.checkTimeout') : t('auth.syncTimeout')}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onReload ?? (() => window.location.reload())}
          >
            {t('auth.reloadPage')}
          </button>
        </>
      ) : (
        <p className="hint">{t('auth.checkingHint')}</p>
      )}
    </div>
  );
}
