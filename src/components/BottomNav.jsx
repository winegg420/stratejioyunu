import { NavLink } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from '../data/placeholder';
import NavAttackAlert from './NavAttackAlert';
import NavExpeditionCount from './NavExpeditionCount';
import { useActiveExpeditionCount, useUnderAttack } from '../stores/gameStore';

export default function BottomNav() {
  const underAttack = useUnderAttack();
  const expeditionCount = useActiveExpeditionCount();

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
            <span className="bottom-nav-icon">
              {item.icon}
              {item.path === '/seferler' && (
                <span className="nav-logistics-badge" aria-hidden="true">
                  📦
                </span>
              )}
            </span>
            {item.path === '/seferler' && (
              <>
                <NavExpeditionCount count={expeditionCount} />
                <NavAttackAlert show={underAttack} />
              </>
            )}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
