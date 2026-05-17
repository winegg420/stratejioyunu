import { Outlet, useLocation } from 'react-router-dom';
import ResourceBar from './ResourceBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  const { pathname } = useLocation();
  const isMapPage = pathname === '/harita';

  return (
    <div className={`app-shell ${isMapPage ? 'route-map' : ''}`}>
      <ResourceBar />
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
