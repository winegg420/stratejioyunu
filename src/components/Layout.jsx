import { Outlet } from 'react-router-dom';
import ResourceBar from './ResourceBar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      <ResourceBar />
      <div className="main-shell">
        <Sidebar />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
