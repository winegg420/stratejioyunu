import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthMapBackground from '../components/AuthMapBackground';
import GlobalBriefingModal from '../components/GlobalBriefingModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GAME_NAME } from '../data/placeholder';

export default function AuthPage() {
  const { t } = useLanguage();
  const { isAuthed, authReady, signIn, loginDemo, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(playerId, password);
      goHome();
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setError('');
    setLoading(true);
    try {
      loginDemo(playerId.trim() || 'Oyuncu');
      goHome();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen auth-page-wrapper">
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

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{t('auth.playerId')}</span>
            <input
              type="text"
              placeholder={t('auth.placeholderId')}
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </label>
          <label>
            <span>{t('auth.password')}</span>
            <input
              type="password"
              placeholder={t('auth.placeholderPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </label>
          <p className="auth-hint">
            {isSupabaseConfigured ? t('auth.hintConfigured') : t('auth.hintDemo')}
          </p>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? t('auth.submitting') : t('auth.submit')}
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
