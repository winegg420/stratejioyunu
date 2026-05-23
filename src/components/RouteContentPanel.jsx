import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PageRouteLoader from './PageRouteLoader';

export default function RouteContentPanel() {
  const { pathname } = useLocation();
  const [enterPulse, setEnterPulse] = useState(true);

  useEffect(() => {
    setEnterPulse(false);
    const id = requestAnimationFrame(() => setEnterPulse(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      className={[
        'route-content-panel',
        enterPulse && 'route-content-panel--enter',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <PageRouteLoader />
      <Outlet />
    </div>
  );
}
