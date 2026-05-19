import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SERVER_NAME } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';
import NavBadge from './NavBadge';
import NavAttackAlert from './NavAttackAlert';
import NavExpeditionCount from './NavExpeditionCount';
import SystemLockedModal from './SystemLockedModal';
import { useActiveExpeditionCount, useReportsNavBadge, useUnderAttack } from '../stores/gameStore';

export default function Sidebar() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const reportsBadge = useReportsNavBadge();
  const underAttack = useUnderAttack();
  const expeditionCount = useActiveExpeditionCount();
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const [lockedFeature, setLockedFeature] = useState(null);

  return (
    <>
      <nav className="sidebar sidebar-desktop" aria-label="Tam menü">
        <div className="sidebar-server">
          <span className="server-label">Sunucu</span>
          <span className="server-name">{SERVER_NAME}</span>
          <span className="city-type">{activeCity?.type}</span>
        </div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path ?? item.label}>
              {item.locked ? (
                <button
                  type="button"
                  className="nav-link nav-link--locked"
                  onClick={() => setLockedFeature(item.label)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-badge nav-badge--locked">KİLİT</span>
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">
                    {item.icon}
                    {item.path === '/seferler' && (
                      <span className="nav-logistics-badge" aria-hidden="true" title="Lojistik">
                        📦
                      </span>
                    )}
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {item.path === '/seferler' && (
                    <>
                      <NavExpeditionCount count={expeditionCount} />
                      <NavAttackAlert show={underAttack} />
                    </>
                  )}
                  {item.path === '/raporlar' && <NavBadge show={reportsBadge} />}
                  {item.coastal && <span className="nav-badge">Kıyı</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <SystemLockedModal
        open={Boolean(lockedFeature)}
        featureLabel={lockedFeature}
        onClose={() => setLockedFeature(null)}
      />
    </>
  );
}
