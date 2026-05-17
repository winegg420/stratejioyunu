import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ResourceBar from './ResourceBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ToastContainer from './ToastContainer';
import { useNotificationStore } from '../stores/notificationStore';

export default function Layout() {
  const { pathname } = useLocation();
  const isMapPage = pathname === '/harita';
  const startDemoEvents = useNotificationStore((s) => s.startDemoEvents);

  useEffect(() => startDemoEvents(), [startDemoEvents]);

  return (
    <div className={`app-shell ${isMapPage ? 'route-map' : ''}`}>
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

