import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { isAuthed, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="auth-loading" aria-live="polite">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/giris" replace state={{ from: location }} />;
  }

  return children;
}
