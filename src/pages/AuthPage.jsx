import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthMapBackground from '../components/AuthMapBackground';
import { useAuth } from '../context/AuthContext';
import { GAME_NAME } from '../data/placeholder';

export default function AuthPage() {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  if (isAuthed) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate('/', { replace: true });
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
        </header>

        <div className="auth-tabs">
          <button
            type="button"
            className={tab === 'login' ? 'active' : ''}
            onClick={() => setTab('login')}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'active' : ''}
            onClick={() => setTab('register')}
          >
            Kayıt Ol
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <label>
              <span>Kullanıcı adı</span>
              <input
                type="text"
                placeholder="Komutan_Alpha"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>
          )}
          <label>
            <span>E-posta</span>
            <input
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Şifre</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {tab === 'login' && (
            <p className="auth-hint">Demo: Herhangi bir e-posta ile giriş yapabilirsiniz.</p>
          )}
          <button type="submit" className="btn btn-primary auth-submit">
            {tab === 'login' ? 'Oyuna Gir' : 'Hesap Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
