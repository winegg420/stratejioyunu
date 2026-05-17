import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ResourceBar from './ResourceBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ToastContainer from './ToastContainer';
import { useGameStore } from '../stores/gameStore';

export default function Layout() {
  const { pathname } = useLocation();
  const isMapPage = pathname === '/harita';
  const startTicker = useGameStore((s) => s.startTicker);
  const clearNavBadge = useGameStore((s) => s.clearNavBadge);

  const syncTimersOnWake = useGameStore((s) => s.syncTimersOnWake);

  useEffect(() => startTicker(), [startTicker]);

  useEffect(() => {
    const onWake = () => {
      if (document.visibilityState === 'visible') {
        syncTimersOnWake();
      }
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [syncTimersOnWake]);

  useEffect(() => {
    if (pathname === '/seferler') clearNavBadge('expeditions');
    if (pathname === '/raporlar') clearNavBadge('reports');
  }, [pathname, clearNavBadge]);

  return (
    <div className={`app-shell hud-shell${isMapPage ? ' route-map' : ''}`}>
      <ResourceBar />
      <ToastContainer />
      <div className="main-shell">
        <Sidebar />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
