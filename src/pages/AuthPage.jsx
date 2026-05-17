import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthMapBackground from '../components/AuthMapBackground';
import { useAuth } from '../context/AuthContext';
import { GAME_NAME } from '../data/placeholder';

export default function AuthPage() {
  const { isAuthed, authReady, signIn, loginDemo, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="auth-screen">
      <AuthMapBackground />
      <div className="auth-overlay" />
      <div className="auth-card">
        <header className="auth-header">
          <p className="auth-eyebrow">Dünya Haritası Stratejisi</p>
          <h1 className="auth-title">{GAME_NAME}</h1>
          <p className="auth-subtitle">Türkiye haritasında fetih, diplomasi ve strateji</p>
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
    </div>
  );
}
