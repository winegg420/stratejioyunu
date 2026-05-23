import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameDataReady } from '../hooks/useGameDataReady';
import { useResourceValueFlashes } from '../hooks/useResourceValueFlashes';
import { STORE_EMPTY_ARRAY, useGameStore, formatCityOptionLabel } from '../stores/gameStore';
import { isDepotOverflow, hasWorkforceShortage } from '../lib/resourceProduction';
import { formatCompactNumber } from '../lib/formatNumber';
import { formatHourlyProduction } from '../lib/hourlyProduction';
import { enrichResourcesWithEmpireTreasury } from '../lib/empireTreasury';
import { GAME_NAME } from '../data/placeholder';
import {
  formatPeaceForceCountdown,
  getProgressionState,
  isPeaceForceProtected,
} from '../lib/progressionSystem';
import ServerTimeClock from './ServerTimeClock';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

const DEPOT_WARN_PCT = 90;
const DEPOT_BAR_IDS = new Set(['hammadde', 'fuel', 'money']);

const FILL_CLASS = {
  hammadde: 'res-fill--hammadde',
  fuel: 'res-fill--fuel',
  money: 'res-fill--money',
};

function ResourceItem({
  resource,
  displayLabel,
  pct,
  flash,
  valueFlash,
  depotWarn,
  depotFull,
  depotOverflow,
  energyCrisis,
  t,
}) {
  const hasDepot = resource.max != null;
  const showDepotBar = hasDepot || DEPOT_BAR_IDS.has(resource.id);
  const frozen = resource.productionFrozen || depotOverflow;
  const fillClass = FILL_CLASS[resource.id] ?? 'res-fill--default';
  const workforceCut = resource.workforcePenalty && !frozen;
  const hourlyLabel = !frozen ? formatHourlyProduction(resource) : null;

  return (
    <div
      className={[
        'resource-item',
        'resource-item--tactical',
        showDepotBar && 'has-depot',
        (flash || valueFlash) && 'resource-flash',
        valueFlash && 'resource-flash--value',
        depotWarn && 'depot-warn',
        depotFull && 'depot-full',
        depotOverflow && 'depot-overflow',
        workforceCut && 'resource-item--workforce',
        energyCrisis && 'resource-item--energy-crisis',
      ]
        .filter(Boolean)
        .join(' ')}
      title={`${displayLabel}: ${resource.current.toLocaleString('tr-TR')}${hasDepot ? ` / ${resource.max.toLocaleString('tr-TR')}` : ''}${hourlyLabel ? ` · ${hourlyLabel}` : ''}${depotOverflow ? ` — ${t('resourceBar.depotFull')}` : ''}${workforceCut ? ` — ${t('workforce.penalty')}` : ''}${energyCrisis ? ` — ${t('workforce.energyCrisis')}` : ''}`}
    >
      <span className="res-icon" aria-hidden="true">
        {resource.icon}
      </span>
      <div className="res-body">
        <span className="res-label">{displayLabel}</span>
        <span className="res-value">
          <span className={['res-value__current', valueFlash && 'res-value__current--pulse'].filter(Boolean).join(' ')}>
            {formatCompactNumber(resource.current)}
          </span>
          {hasDepot && <span className="res-max"> / {formatCompactNumber(resource.max)}</span>}
          {frozen && <span className="res-stgn-badge">[ STGN ]</span>}
        </span>
        {resource.empireShared && (
          <span className="res-empire-badge" title={t('resourceBar.sharedTreasuryTitle')}>
            {t('resourceBar.sharedTreasury')}
          </span>
        )}
        {hourlyLabel ? (
          <span className="res-hourly-live">{hourlyLabel}</span>
        ) : (
          <span className={`res-rate${frozen ? ' res-rate--stopped' : ''}`}>
            {frozen ? t('resourceBar.stopped') : '—'}
          </span>
        )}
        {showDepotBar && (
          <div
            className="res-bar res-bar--command"
            role="progressbar"
            aria-valuenow={Math.min(100, pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${displayLabel} depo`}
          >
            <div
              className={`res-fill res-fill--command ${fillClass}${depotWarn ? ' warn' : ''}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceBar() {
  const { t, resourceLabel } = useLanguage();
  const gameReady = useGameDataReady();
  const { playerName } = useAuth();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const setActiveCity = useGameStore((s) => s.setActiveCity);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const activeCity = useGameStore((s) => s.cities[s.activeCityId]);
  const flashes = useGameStore((s) => s.flashes);
  const valueFlashes = useResourceValueFlashes(resources);
  const workforceShortage = hasWorkforceShortage(activeCity);
  const protectionEndsAt = useGameStore((s) => s.protectionEndsAt);
  const peaceActive = isPeaceForceProtected(protectionEndsAt);
  const peaceCountdown = formatPeaceForceCountdown(protectionEndsAt);
  const progression = activeCity ? getProgressionState(activeCity) : null;
  const visibleResources = progression?.kbrnUnlocked
    ? resources
    : resources.filter((r) => r.id !== 'uranium');

  const energyRes = resources.find((r) => r.id === 'energy');
  const energyCrisis = energyRes != null && energyRes.current < 0;

  const hasResources = visibleResources.length > 0;
  const showSyncOnly = !gameReady && !hasResources;

  if (showSyncOnly) {
    return (
      <header
        className="resource-bar resource-bar--tactical resource-bar--command resource-bar--loading"
        role="banner"
        aria-busy="true"
      >
        <div className="resource-bar-inner resource-bar-inner--flush">
          <div className="resource-bar-brand resource-bar-brand--loading">
            <span className="game-title">{GAME_NAME}</span>
            <span className="resource-bar-sync-line">{t('resourceBar.syncing')}</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={[
        'resource-bar',
        'resource-bar--tactical',
        'resource-bar--command',
        !gameReady && hasResources && 'resource-bar--soft-sync',
        workforceShortage && 'resource-bar--workforce-warn',
      ]
        .filter(Boolean)
        .join(' ')}
      role="banner"
    >
      {workforceShortage && (
        <p className="resource-bar-workforce-warn" role="status">
          {t('workforce.penalty')}
        </p>
      )}
      <div className="resource-bar-inner resource-bar-inner--flush">
        <div className="brand-block brand-desktop resource-bar-brand">
          <span className="game-title">{GAME_NAME}</span>
          {!gameReady && hasResources && (
            <span className="resource-bar-sync-line resource-bar-sync-line--inline">{t('resourceBar.syncing')}</span>
          )}
          <label className="city-switcher">
            <span className="sr-only">{t('resourceBar.activeCity')}</span>
            <select
              value={activeCityId}
              onChange={(e) => setActiveCity(e.target.value)}
              className="city-switcher-select"
            >
              {playerCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCityOptionLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="resources-row resources-row--tactical" role="list" aria-label={t('resourceBar.resources')}>
          {visibleResources.map((r) => {
            const pct = r.max ? (r.current / r.max) * 100 : 100;
            const depotOverflow = isDepotOverflow(r);
            const depotFull = r.max != null && r.current >= r.max;
            const depotWarn = r.max != null && pct >= DEPOT_WARN_PCT && !depotFull;
            return (
              <ResourceItem
                key={r.id}
                resource={r}
                displayLabel={resourceLabel(r.id) || r.label}
                t={t}
                pct={pct}
                flash={Boolean(flashes[r.id])}
                valueFlash={Boolean(valueFlashes[r.id])}
                depotWarn={depotWarn}
                depotFull={depotFull}
                depotOverflow={depotOverflow}
                energyCrisis={r.id === 'energy' && energyCrisis}
              />
            );
          })}
        </div>

        <div className="resource-bar-actions resource-bar-actions--tactical">
          <LanguageSwitcher className="lang-switcher--bar" />
          <ServerTimeClock />
          <div className="player-block player-desktop">
            <span className="player-name">{playerName}</span>
            {peaceActive && (
              <span
                className="protection-badge protection-badge--active"
                title={t('resourceBar.peaceForceTitle')}
              >
                <span className="protection-badge__icon" aria-hidden="true">
                  🕊️
                </span>
                <span className="protection-badge__text">
                  {t('resourceBar.peaceForce')}
                  {peaceCountdown ? ` · ${peaceCountdown}` : ''}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

