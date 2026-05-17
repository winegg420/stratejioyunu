import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SERVER_NAME } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';
import NavBadge from './NavBadge';

export default function Sidebar() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const navBadges = useGameStore((s) => s.navBadges);
  const activeCity = playerCities.find((c) => c.id === activeCityId);

  return (
    <nav className="sidebar sidebar-desktop" aria-label="Tam menü">
      <div className="sidebar-server">
        <span className="server-label">Sunucu</span>
        <span className="server-name">{SERVER_NAME}</span>
        <span className="city-type">{activeCity?.type}</span>
      </div>
      <ul className="nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.path === '/seferler' && <NavBadge show={navBadges.expeditions} />}
              {item.path === '/raporlar' && <NavBadge show={navBadges.reports} />}
              {item.coastal && <span className="nav-badge">Kıyı</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
