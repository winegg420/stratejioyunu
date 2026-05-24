import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ResourceBar from './ResourceBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TerminalBottomDock from './TerminalBottomDock';
import RouteContentPanel from './RouteContentPanel';
import PwaUpdateBanner from './PwaUpdateBanner';
import ContentInfoModal from './ContentInfoModal';
import CyberShellChrome from './CyberShellChrome';
import IncomingThreatFlash from './IncomingThreatFlash';
import DevTestModeBanner from './DevTestModeBanner';
import { useTerminalLogStore } from '../stores/terminalLogStore';
import ErrorBoundary from './ErrorBoundary';
import ToastContainer from './ToastContainer';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../lib/auth';
import {
  registerExpeditionPersistenceGuards,
  startSyncPolling,
  stopSyncPolling,
} from '../lib/supabaseSync';
import { useGameStore } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { useMobileScrollGuard } from '../hooks/useMobileScrollGuard';
import { releaseMapSessionLocks } from '../map/mapRouteCleanup';
import { applyDocumentTitle } from '../lib/documentTitle';
const MOBILE_SHELL_CLASS = 'mobile-shell-active';

export default function Layout() {
  const { pathname } = useLocation();
  const isMapPage = pathname === '/harita';
  const isBuildingsPage = pathname === '/binalar';
  const isMobile = useIsMobile();
  const contentRef = useRef(null);
  useMobileScrollGuard(isMobile);
  const startTicker = useGameStore((s) => s.startTicker);
  const clearNavBadge = useGameStore((s) => s.clearNavBadge);

  const syncTimersOnWake = useGameStore((s) => s.syncTimersOnWake);
  const initWorldSystems = useGameStore((s) => s.initWorldSystems);
  const touchPlayerActivity = useGameStore((s) => s.touchPlayerActivity);
  const { session, authMode, authReady } = useAuth();
  const hydrateAttemptRef = useRef(null);

  // useHudButtonStrokes — MutationObserver döngü riski; geçici kapalı

  useEffect(() => {
    applyDocumentTitle();
  }, []);

  useEffect(() => {
    initWorldSystems();
  }, [initWorldSystems]);

  useEffect(() => {
    if (!authReady || authMode !== 'supabase' || !session?.user?.id) return undefined;
    const userId = session.user.id;
    const state = useGameStore.getState();
    if (state.gameHydrating) return undefined;
    if (state._supabaseHydrated && state.playerCities?.length) return undefined;
    if (hydrateAttemptRef.current === userId) return undefined;

    hydrateAttemptRef.current = userId;
    useGameStore.getState().hydrateFromSupabase(userId, getDisplayName(session.user)).catch(() => {
      hydrateAttemptRef.current = null;
    });
    return undefined;
  }, [authReady, authMode, session?.user?.id]);

  useEffect(() => startTicker(), [startTicker]);

  useEffect(() => {
    if (authMode !== 'supabase' || !session?.user?.id) {
      stopSyncPolling();
      return undefined;
    }

    startSyncPolling(
      () => useGameStore.getState(),
      (patch) => useGameStore.setState(patch),
      (id) => useGameStore.getState()._completeExpedition(id),
    );
    return stopSyncPolling;
  }, [authMode, session?.user?.id]);

  useEffect(() => {
    if (authMode !== 'supabase') return undefined;
    return registerExpeditionPersistenceGuards(() => useGameStore.getState());
  }, [authMode]);

  useEffect(() => {
    const onWake = () => {
      if (document.visibilityState === 'visible') {
        touchPlayerActivity();
        syncTimersOnWake();
        window.dispatchEvent(new Event('map-layout-changed'));
      }
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [syncTimersOnWake, touchPlayerActivity]);

  useEffect(() => {
    if (pathname === '/seferler') clearNavBadge('expeditions');
    if (pathname === '/raporlar') clearNavBadge('reports');
  }, [pathname, clearNavBadge]);

  useEffect(() => {
    useTerminalLogStore.getState().appendRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) {
      document.documentElement.classList.remove(MOBILE_SHELL_CLASS);
      return undefined;
    }
    document.documentElement.classList.add(MOBILE_SHELL_CLASS);
    return () => document.documentElement.classList.remove(MOBILE_SHELL_CLASS);
  }, [isMobile]);

  useEffect(() => {
    if (pathname !== '/harita') {
      releaseMapSessionLocks();
    }
    document.body.classList.remove('map-scroll-locked');
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.style.overflow = '';
      contentRef.current.style.pointerEvents = '';
    }
  }, [pathname]);

  return (
    <div
      className={`app-shell hud-shell hud-final${isMobile ? ' mobile-app' : ''}${isMapPage ? ' route-map' : ''}${isBuildingsPage ? ' route-buildings' : ''}`}
    >
      <ResourceBar />
      <DevTestModeBanner />
      <IncomingThreatFlash />
      <PwaUpdateBanner />
      <ToastContainer />
      {isMapPage && <CyberShellChrome />}
      <TerminalBottomDock />
      <ContentInfoModal />
      <div className="main-shell">
        <Sidebar />
        <main className="content-area content-area--terminal" ref={contentRef}>
          <ErrorBoundary>
            <RouteContentPanel />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
