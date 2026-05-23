import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthMapBackground from '../components/AuthMapBackground';
import LanguageSwitcher from '../components/LanguageSwitcher';
import GlobalBriefingModal from '../components/GlobalBriefingModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GAME_NAME } from '../data/placeholder';

export default function AuthPage() {
  const { t } = useLanguage();
  const {
    isAuthed,
    authReady,
    signIn,
    register,
    loginWithGoogle,
    loginDemo,
    isSupabaseConfigured,
  } = useAuth();
  const navigate = useNavigate();
  const [authTab, setAuthTab] = useState('login');
  const [playerId, setPlayerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [previewBriefing, setPreviewBriefing] = useState(false);

  if (!authReady) {
    return (
      <div className="auth-loading-screen" aria-live="polite">
        <p>{t('auth.checking')}</p>
      </div>
    );
  }

  if (isAuthed) {
    return <Navigate to="/" replace />;
  }

  const goHome = () => navigate('/', { replace: true });

  const handleGoogle = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (authTab === 'register') {
        if (password !== passwordConfirm) {
          throw new Error(t('auth.passwordMismatch'));
        }
        const result = await register(playerId, password, displayName);
        if (result.needsEmailConfirm) {
          setInfo(t('auth.confirmEmailSent'));
          setLoading(false);
          return;
        }
      } else {
        await signIn(playerId, password);
      }
      goHome();
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      loginDemo(playerId.trim() || displayName.trim() || 'Oyuncu');
      goHome();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen auth-page-wrapper">
      <LanguageSwitcher className="lang-switcher--auth" />
      <AuthMapBackground />
      <div className="auth-overlay" />
      <div className="auth-card">
        <header className="auth-header">
          <p className="auth-eyebrow">{t('auth.eyebrow')}</p>
          <h1 className="auth-title auth-card__title">{GAME_NAME}</h1>
          <p className="auth-subtitle auth-card__sub">
            {t('auth.subtitle')}
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm auth-briefing-link"
            onClick={() => setPreviewBriefing(true)}
          >
            {t('auth.briefing')}
          </button>
          {isSupabaseConfigured && (
            <span className="auth-supabase-badge">{t('auth.supabaseConnected')}</span>
          )}
        </header>

        {isSupabaseConfigured && (
          <>
            <button
              type="button"
              className="btn auth-google-btn"
              onClick={handleGoogle}
              disabled={loading}
            >
              <span className="auth-google-btn__icon" aria-hidden="true">G</span>
              {t('auth.googleLogin')}
            </button>
            <p className="auth-divider">
              <span>{t('auth.orDivider')}</span>
            </p>
          </>
        )}

        <div className="auth-tabs" role="tablist" aria-label={t('auth.tabsAria')}>
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'login'}
            className={authTab === 'login' ? 'active' : ''}
            onClick={() => { setAuthTab('login'); setError(''); setInfo(''); }}
            disabled={loading}
          >
            {t('auth.tabLogin')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'register'}
            className={authTab === 'register' ? 'active' : ''}
            onClick={() => { setAuthTab('register'); setError(''); setInfo(''); }}
            disabled={loading || !isSupabaseConfigured}
          >
            {t('auth.tabRegister')}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {authTab === 'register' && (
            <label>
              <span>{t('auth.displayName')}</span>
              <input
                type="text"
                placeholder={t('auth.placeholderDisplayName')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="nickname"
                disabled={loading}
              />
            </label>
          )}
          <label>
            <span>{t('auth.emailOrId')}</span>
            <input
              type="text"
              placeholder={t('auth.placeholderEmail')}
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              autoComplete={authTab === 'register' ? 'email' : 'username'}
              disabled={loading}
              required
            />
          </label>
          <label>
            <span>{t('auth.password')}</span>
            <input
              type="password"
              placeholder={t('auth.placeholderPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={authTab === 'register' ? 'new-password' : 'current-password'}
              disabled={loading}
              required={authTab === 'register' || isSupabaseConfigured}
            />
          </label>
          {authTab === 'register' && (
            <label>
              <span>{t('auth.passwordConfirm')}</span>
              <input
                type="password"
                placeholder={t('auth.placeholderPassword')}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </label>
          )}
          <p className="auth-hint">
            {isSupabaseConfigured ? t('auth.hintConfigured') : t('auth.hintDemo')}
          </p>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="auth-info" role="status">
              {info}
            </p>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading
              ? t('auth.submitting')
              : (authTab === 'register' ? t('auth.submitRegister') : t('auth.submit'))}
          </button>
          <button
            type="button"
            className="btn btn-secondary auth-quick"
            onClick={handleQuickLogin}
            disabled={loading}
          >
            {t('auth.quickLogin')}
          </button>
        </form>
      </div>

      <GlobalBriefingModal
        open={previewBriefing}
        showGovernancePick={false}
        onAccept={() => setPreviewBriefing(false)}
      />
    </div>
  );
}
