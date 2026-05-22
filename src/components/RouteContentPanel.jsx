import { Outlet, useLocation } from 'react-router-dom';

export default function RouteContentPanel() {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="route-content-panel route-content-panel--enter">
      <Outlet />
    </div>
  );
}
