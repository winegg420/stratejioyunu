import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { isAuthed, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="auth-loading-screen" aria-live="polite">
        <p>Oturum kontrol ediliyor…</p>
        <p className="hint">Bu ekran 10 saniyeden uzun sürerse sayfayı yenileyin veya Hızlı Giriş kullanın.</p>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/giris" replace state={{ from: location }} />;
  }

  return children;
}
