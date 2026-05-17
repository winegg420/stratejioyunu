import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SERVER_NAME, CITY_TYPE } from '../data/placeholder';

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-server">
        <span className="server-label">Sunucu</span>
        <span className="server-name">{SERVER_NAME}</span>
        <span className="city-type">{CITY_TYPE}</span>
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
              {item.coastal && <span className="nav-badge">Kıyı</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
