import { NavLink } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';
import NavBadge from './NavBadge';

export default function BottomNav() {
  const navBadges = useGameStore((s) => s.navBadges);

  return (
    <nav className="bottom-nav" aria-label="Ana menü">
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon-wrap">
            <span className="bottom-nav-icon">{item.icon}</span>
            {item.path === '/seferler' && <NavBadge show={navBadges.expeditions} />}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
