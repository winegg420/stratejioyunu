import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthMapBackground from '../components/AuthMapBackground';
import GlobalBriefingModal from '../components/GlobalBriefingModal';
import { useAuth } from '../context/AuthContext';
import { GAME_NAME } from '../data/placeholder';

export default function AuthPage() {
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
        <p>Oturum kontrol ediliyor…</p>
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
      setError(err.message || 'Giriş yapılamadı.');
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
          <p className="auth-eyebrow">[ KÜRESEL BAŞKANLIK · 2044 ]</p>
          <h1 className="auth-title auth-card__title">{GAME_NAME}</h1>
          <p className="auth-subtitle auth-card__sub">
            Mutlak otorite — tek lider, resmi State Mail, harita üzerinde güç mücadelesi
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm auth-briefing-link"
            onClick={() => setPreviewBriefing(true)}
          >
            [ ULUSAL BRİFİNG ] Oku
          </button>
          {isSupabaseConfigured && (
            <span className="auth-supabase-badge">Supabase bağlı</span>
          )}
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Oyuncu ID</span>
            <input
              type="text"
              placeholder="istediğiniz bir ad veya e-posta"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </label>
          <label>
            <span>Şifre</span>
            <input
              type="password"
              placeholder="istediğiniz bir şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </label>
          <p className="auth-hint">
            {isSupabaseConfigured
              ? 'Şifre boş bırakılırsa veya Hızlı Giriş ile demo modda girersiniz. Şifre girerseniz Supabase hesabınızla giriş yapılır. Kayıt şu an kapalıdır.'
              : 'Kayıt gerekmez. Rastgele ID yazıp Hızlı Giriş ile doğrudan oyuna girebilirsiniz. Supabase anahtarları .env dosyasına eklendiğinde gerçek giriş açılır.'}
          </p>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor…' : 'Oyuna Gir'}
          </button>
          <button
            type="button"
            className="btn btn-secondary auth-quick"
            onClick={handleQuickLogin}
            disabled={loading}
          >
            Hızlı Giriş (boş bırak)
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
