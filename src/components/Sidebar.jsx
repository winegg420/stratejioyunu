import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SERVER_NAME } from '../data/placeholder';
import { getProgressionState } from '../lib/progressionSystem';
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
  const city = useGameStore((s) => s.cities[activeCityId]);
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const progression = getProgressionState(city);
  const [lockedFeature, setLockedFeature] = useState(null);

  const navItems = NAV_ITEMS.map((item) => {
    if (item.label === 'Siber Operasyon') {
      return {
        ...item,
        locked: !progression.cyberUnlocked,
        lockTag: progression.locks.cyber ?? 'SİBER MERKEZ',
      };
    }
    if (item.path === '/arastirma' && !progression.kbrnUnlocked) {
      return {
        ...item,
        lockTag: progression.locks.kbrn ?? 'AR-GE SV.8',
      };
    }
    return item;
  });

  return (
    <>
      <nav className="sidebar sidebar-desktop sidebar-hud" aria-label="Tam menü">
        <div className="sidebar-server">
          <span className="server-label">SUNUCU</span>
          <span className="server-name">{SERVER_NAME}</span>
          <span className="city-type">{activeCity?.type}</span>
        </div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path ?? item.label}>
              {item.locked ? (
                <button
                  type="button"
                  className="nav-link nav-link--locked"
                  onClick={() => setLockedFeature(item.label)}
                >
                  <span className="nav-icon">
                    {item.icon}
                    <span className="nav-lock-icon" aria-hidden="true">🔒</span>
                  </span>
                  <span className="nav-label">{item.label}</span>
                  <span
                    className="nav-badge nav-badge--hq-lock"
                  >
                    {item.label === 'İttifak'
                      ? '[ KİLİTLİ: HQ SV.1 ]'
                      : item.lockTag
                        ? `[ KİLİTLİ: ${item.lockTag} ]`
                        : '[ KİLİTLİ ]'}
                  </span>
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
        variant={lockedFeature === 'Güneş Sistemi' || lockedFeature === 'İttifak' ? 'upgrade' : 'default'}
        onClose={() => setLockedFeature(null)}
      />
    </>
  );
}
