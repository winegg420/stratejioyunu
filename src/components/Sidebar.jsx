import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SERVER_NAME } from '../data/placeholder';
import { useLanguage } from '../context/LanguageContext';
import { getProgressionState } from '../lib/progressionSystem';
import { getNavItemLabel } from '../lib/navLabels';
import { useGameStore } from '../stores/gameStore';
import NavBadge from './NavBadge';
import NavAttackAlert from './NavAttackAlert';
import NavExpeditionCount from './NavExpeditionCount';
import SystemLockedModal from './SystemLockedModal';
import SidebarActiveBeam from './SidebarActiveBeam';
import {
  useActiveExpeditionCount,
  useActiveIntelOperationCount,
  useReportsNavBadge,
  useUnderAttack,
} from '../stores/gameStore';

export default function Sidebar() {
  const { t } = useLanguage();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const reportsBadge = useReportsNavBadge();
  const underAttack = useUnderAttack();
  const expeditionCount = useActiveExpeditionCount();
  const intelOpCount = useActiveIntelOperationCount();
  const city = useGameStore((s) => s.cities[activeCityId]);
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const progression = getProgressionState(city);
  const [lockedFeature, setLockedFeature] = useState(null);
  const navListRef = useRef(null);

  const navItems = NAV_ITEMS.map((item) => {
    if (item.labelKey === 'nav.cyberOps') {
      return {
        ...item,
        locked: !progression.cyberUnlocked,
        lockTag: progression.locks.cyber ?? t('sidebar.lockTags.cyber'),
      };
    }
    if (item.path === '/arastirma' && !progression.kbrnUnlocked) {
      return {
        ...item,
        lockTag: progression.locks.kbrn ?? t('sidebar.lockTags.kbrn'),
      };
    }
    return item;
  });

  return (
    <>
      <nav className="sidebar sidebar-desktop sidebar-hud" aria-label={t('sidebar.fullMenu')}>
        <div className="sidebar-server">
          <span className="server-label">{t('sidebar.server')}</span>
          <span className="server-name">{SERVER_NAME}</span>
          <span className="city-type">{activeCity?.type}</span>
        </div>
        <ul className="nav-list" ref={navListRef}>
          <SidebarActiveBeam listRef={navListRef} />
          {navItems.map((item) => {
            const label = getNavItemLabel(item, t);
            return (
            <li key={item.path ?? item.labelKey}>
              {item.locked ? (
                <button
                  type="button"
                  className="nav-link nav-link--locked"
                  onClick={() => setLockedFeature(label)}
                >
                  <span className="nav-icon">
                    {item.icon}
                    <span className="nav-lock-icon" aria-hidden="true">🔒</span>
                  </span>
                  <span className="nav-label">{label}</span>
                  <span
                    className="nav-badge nav-badge--hq-lock"
                    title={
                      item.labelKey === 'nav.alliance'
                        ? t('sidebar.lockedHq')
                        : item.lockTag
                          ? t('sidebar.lockedTag', { tag: item.lockTag })
                          : t('sidebar.locked')
                    }
                  >
                    {item.labelKey === 'nav.alliance'
                      ? `[ ${t('sidebar.lockedHq')} ]`
                      : item.lockTag
                        ? `[ ${t('sidebar.lockedTag', { tag: item.lockTag })} ]`
                        : `[ ${t('sidebar.locked')} ]`}
                  </span>
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">
                    {item.icon}
                    {item.path === '/seferler' && (
                      <span
                        className="nav-logistics-badge"
                        aria-hidden="true"
                        title={t('navBadge.logisticsTitle')}
                      >
                        📦
                      </span>
                    )}
                    {item.path === '/seferler' && (
                      <>
                        <NavExpeditionCount
                          count={expeditionCount}
                          title={t('navBadge.expeditionCount', { count: expeditionCount })}
                        />
                        <NavAttackAlert show={underAttack} />
                      </>
                    )}
                    {item.path === '/istihbarat' && (
                      <NavExpeditionCount
                        count={intelOpCount}
                        title={t('navBadge.intelOpCount', { count: intelOpCount })}
                      />
                    )}
                  </span>
                  <span className="nav-label">{label}</span>
                  {item.path === '/raporlar' && <NavBadge show={reportsBadge} />}
                  {item.coastal && (
                    <span className="nav-badge nav-badge--coastal">{t('navBadge.coastal')}</span>
                  )}
                </NavLink>
              )}
            </li>
          );
          })}
        </ul>
      </nav>
      <SystemLockedModal
        open={Boolean(lockedFeature)}
        featureLabel={lockedFeature}
        variant={lockedFeature === 'Güneş Sistemi' || lockedFeature === t('nav.alliance') ? 'upgrade' : 'default'}
        onClose={() => setLockedFeature(null)}
      />
    </>
  );
}
