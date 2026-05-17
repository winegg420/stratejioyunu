import { NavLink } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from '../data/placeholder';

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Ana menü">
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
