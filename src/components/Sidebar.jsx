import { useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SERVER_NAME } from '../data/placeholder';
import { useLanguage } from '../context/LanguageContext';
import { getProgressionState } from '../lib/progressionSystem';
import { useAuth } from '../context/AuthContext';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { resolvePlayerDisplayName } from '../lib/profileApi';
import { getNavItemLabel } from '../lib/navLabels';
import { isCoastalPlayerCity } from '../lib/cityManagementUi';
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

function applyNavLocks(item, progression, t) {
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
}

function NavEntry({
  item,
  t,
  reportsBadge,
  underAttack,
  expeditionCount,
  intelOpCount,
  setLockedFeature,
  activePlayerCity,
}) {
  const label = getNavItemLabel(item, t);
  const hint = item.hintKey ? t(item.hintKey) : label;
  const coastal = isCoastalPlayerCity(activePlayerCity);
  const showCoastalReq = item.shipyardNav && !coastal;
  const showCoastalOk = item.shipyardNav && coastal;

  if (item.locked) {
    return (
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
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      title={hint}
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
      {showCoastalReq && (
        <span
          className="nav-badge nav-badge--coastal nav-badge--coastal-req"
          title={t('navBadge.coastalReqTitle')}
        >
          {t('navBadge.coastalReq')}
        </span>
      )}
      {showCoastalOk && (
        <span
          className="nav-badge nav-badge--coastal nav-badge--coastal-ok"
          title={t('navBadge.coastalOkTitle')}
        >
          {t('navBadge.coastalOk')}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { t, countryLabel } = useLanguage();
  const { playerName: authPlayerName, session } = useAuth();
  const profileDisplayName = useGameStore((s) => s.profileDisplayName);
  const profilePlayerName = useGameStore((s) => s.profilePlayerName);
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
    if (item.type === 'group' && item.children?.length) {
      return {
        ...item,
        children: item.children.map((child) => applyNavLocks(child, progression, t)),
      };
    }
    return applyNavLocks(item, progression, t);
  });

  const presidentLabel = useMemo(() => {
    const resolved = resolvePlayerDisplayName({
      user: session?.user,
      profileDisplayName: profileDisplayName || profilePlayerName,
      playerName: authPlayerName,
    });
    const identity = getCurrentPlayerName();
    const pick = [resolved, identity, authPlayerName]
      .map((n) => String(n ?? '').trim())
      .find((n) => n && n !== 'Oyuncu');
    return pick || t('common.playerFallback');
  }, [session?.user, profileDisplayName, profilePlayerName, authPlayerName, t]);
  const activeCountryLabel = activeCity?.name
    ? countryLabel(activeCity.name)
    : '—';

  const navEntryProps = {
    t,
    reportsBadge,
    underAttack,
    expeditionCount,
    intelOpCount,
    setLockedFeature,
    activePlayerCity: activeCity,
  };

  return (
    <>
      <nav className="sidebar sidebar-desktop sidebar-hud" aria-label={t('sidebar.fullMenu')}>
        <div className="sidebar-server">
          <span className="server-label">{t('sidebar.server')}</span>
          <span className="server-name">{presidentLabel}</span>
          <span className="city-type">{activeCountryLabel}</span>
        </div>
        <ul className="nav-list" ref={navListRef}>
          <SidebarActiveBeam listRef={navListRef} />
          {navItems.map((item) => {
            if (item.type === 'group' && item.children?.length) {
              return (
                <li key={item.labelKey} className="nav-group">
                  <div
                    className="nav-group__head"
                    role="group"
                    aria-label={t(item.labelKey)}
                    title={t('nav.militaryGroupHint')}
                  >
                    <span className="nav-group__icon" aria-hidden="true">{item.icon}</span>
                    <span className="nav-group__title">{t(item.labelKey)}</span>
                  </div>
                  <ul className="nav-group__list">
                    {item.children.map((child) => (
                      <li key={child.path ?? child.labelKey} className="nav-group__item">
                        <NavEntry item={child} {...navEntryProps} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            return (
              <li key={item.path ?? item.labelKey}>
                <NavEntry item={item} {...navEntryProps} />
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
