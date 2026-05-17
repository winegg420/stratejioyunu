import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthMapBackground from '../components/AuthMapBackground';
import { useAuth } from '../context/AuthContext';
import { GAME_NAME } from '../data/placeholder';

export default function AuthPage() {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthed) {
    return <Navigate to="/" replace />;
  }

  const enterGame = () => {
    login(playerId.trim() || 'Oyuncu');
    navigate('/', { replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    enterGame();
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

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Oyuncu ID</span>
            <input
              type="text"
              placeholder="istediğiniz bir ad"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              autoComplete="username"
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
            />
          </label>
          <p className="auth-hint">
            Kayıt gerekmez. Rastgele ID ve şifre yazıp doğrudan oyuna girebilirsiniz.
          </p>
          <button type="submit" className="btn btn-primary auth-submit">
            Oyuna Gir
          </button>
          <button type="button" className="btn btn-secondary auth-quick" onClick={enterGame}>
            Hızlı Giriş (boş bırak)
          </button>
        </form>
      </div>
    </div>
  );
}
