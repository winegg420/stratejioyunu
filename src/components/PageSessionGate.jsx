import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameDataReady } from '../hooks/useGameDataReady';
import { isLightSessionRoute } from '../lib/routeSessionPolicy';
import AuthLoadingScreen from './AuthLoadingScreen';

export const PAGE_SESSION_TIMEOUT_MS = 12_000;

/**
 * Tüm korumalı sayfalar — oturum + oyun verisi (RequireAuth sonrası RouteContentPanel içinde).
 */
export default function PageSessionGate({ children, loadingMessageKey = 'auth.syncingGame' }) {
  const { pathname } = useLocation();
  const { authReady, isAuthed } = useAuth();
  const gameReady = useGameDataReady();
  const lightRoute = isLightSessionRoute(pathname);
  const [timedOut, setTimedOut] = useState(false);

  const waitingAuth = !authReady;
  const waitingGame = isAuthed && !lightRoute && !gameReady;
  const waiting = waitingAuth || waitingGame;

  useEffect(() => {
    if (!waiting) {
      setTimedOut(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setTimedOut(true), PAGE_SESSION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [waiting, waitingAuth, waitingGame]);

  if (waitingAuth) {
    return <AuthLoadingScreen messageKey="auth.checking" timedOut={timedOut} />;
  }

  if (waitingGame && !timedOut) {
    return (
      <div className="page page--console page-session-gate" aria-live="polite">
        <AuthLoadingScreen messageKey={loadingMessageKey} timedOut={false} />
      </div>
    );
  }

  if (waitingGame && timedOut) {
    return (
      <>
        <div className="page-session-gate__timeout-banner" role="status" aria-live="polite">
          <AuthLoadingScreen messageKey={loadingMessageKey} timedOut />
        </div>
        {children}
      </>
    );
  }

  return children;
}
