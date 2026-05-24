import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';
import { PAGE_SESSION_TIMEOUT_MS } from './PageSessionGate';

export default function RequireAuth({ children }) {
  const { isAuthed, authReady } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (authReady) {
      setTimedOut(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setTimedOut(true), PAGE_SESSION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [authReady]);

  if (!authReady) {
    return <AuthLoadingScreen messageKey="auth.checking" timedOut={timedOut} />;
  }

  if (!isAuthed) {
    return <Navigate to="/giris" replace state={{ from: location }} />;
  }

  return children;
}
