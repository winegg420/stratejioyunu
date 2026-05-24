import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameDataReady } from '../hooks/useGameDataReady';
import { useResourceValueFlashes } from '../hooks/useResourceValueFlashes';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { isDepotOverflow, hasWorkforceShortage } from '../lib/resourceProduction';
import { formatCompactNumber } from '../lib/formatNumber';
import { formatHourlyProduction, getHourlyAmount, formatHourlyAmount } from '../lib/hourlyProduction';
import { formatCityOptionLabel } from '../lib/cityManagementUi';
import { isMainHqCity } from '../lib/worldCitySystem';
import { getEmpireMoneyTotal } from '../lib/empireTreasury';
import BudgetSpendFloater from './BudgetSpendFloater';
import CustomDropdown from './CustomDropdown';
import { GAME_NAME } from '../data/placeholder';
import {
  formatPeaceForceCountdown,
  isPeaceForceProtected,
} from '../lib/progressionSystem';
import ServerTimeClock from './ServerTimeClock';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { useResourceBarHeight } from '../hooks/useResourceBarHeight';

const DEPOT_WARN_PCT = 90;

/** Üst bar — 5 kaynak (uranyum yalnızca Binalar / Araştırma) */
const RESOURCE_ROW_TOP = ['food', 'fuel', 'hammadde', 'energy', 'money'];

function pickResourcesByIds(resources, ids) {
  const byId = new Map(resources.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

function renderResourceItems({
  items,
  flashes,
  valueFlashes,
  energyCrisis,
  budgetSpendFloats,
  resourceLabel,
  t,
}) {
  return items.map((r) => {
    const current = Math.floor(r.current ?? 0);
    const max = r.max != null ? Math.floor(r.max) : null;
    const pct = max ? (current / max) * 100 : 100;
    const depotOverflow = isDepotOverflow(r);
    const depotFull = max != null && current >= max;
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
        budgetSpendFloats={r.id === 'money' ? budgetSpendFloats : null}
      />
    );
  });
}

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
  budgetSpendFloats,
  t,
}) {
  const hasDepot = resource.max != null;
  const frozen = resource.productionFrozen || depotOverflow;
  const workforceCut = resource.workforcePenalty && !frozen;
  const hourlyLabel = !frozen ? formatHourlyProduction(resource) : null;
  const hourlyAmount = !frozen ? getHourlyAmount(resource) : 0;
  const showHourlyBadge = hourlyAmount > 0 && ['hammadde', 'fuel', 'money', 'food', 'energy'].includes(resource.id);
  const hourlyZeroLabel = resource.id === 'energy'
    ? `+0${t('cityManagement.hourlyEnergy')}`
    : t('common.perHourZero');
  const foodHourlyTitle = resource.id === 'food' && !frozen && !showHourlyBadge && !hourlyLabel
    ? t('resourceBar.foodHourlyZeroTitle')
    : undefined;

  return (
    <div
      className={[
        'resource-item',
        'resource-item--tactical',
        'resource-item--bar-cell',
        resource.id === 'money' && 'resource-item--money',
        hasDepot && 'has-depot',
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
      {resource.id === 'money' && budgetSpendFloats?.length > 0 && (
        <div className="budget-spend-float-layer" aria-hidden="true">
          {budgetSpendFloats.map((f) => (
            <BudgetSpendFloater key={f.id} amount={f.amount} />
          ))}
        </div>
      )}
      <div className="res-bar-cell__head">
        <span className="res-icon" aria-hidden="true">
          {resource.icon}
        </span>
        <span className="res-label">{displayLabel}</span>
      </div>
      <div className="res-bar-cell__value">
        <span className={['res-value__current', valueFlash && 'res-value__current--pulse'].filter(Boolean).join(' ')}>
          {formatCompactNumber(resource.current)}
        </span>
        {hasDepot && (
          <span className="res-bar-cell__cap">
            / {formatCompactNumber(resource.max)}
          </span>
        )}
        {frozen && <span className="res-stgn-badge">[ STGN ]</span>}
        {resource.empireShared && (
          <span className="res-empire-badge" title={t('resourceBar.sharedTreasuryTitle')}>
            {t('resourceBar.sharedTreasury')}
          </span>
        )}
      </div>
      <div className="res-bar-cell__foot">
        {showHourlyBadge ? (
          <span className="res-hourly-badge font-hud-data">
            +{formatHourlyAmount(hourlyAmount)}
            {resource.id === 'energy' ? t('cityManagement.hourlyEnergy') : t('cityManagement.hourlyPerHour')}
          </span>
        ) : hourlyLabel ? (
          <span className="res-hourly-live">{hourlyLabel}</span>
        ) : (
          <span
            className={`res-rate${frozen ? ' res-rate--stopped' : ''}`}
            title={foodHourlyTitle}
          >
            {frozen ? t('resourceBar.stopped') : hourlyZeroLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResourceBar() {
  const gameReady = useGameDataReady();
  const barRef = useResourceBarHeight([gameReady]);
  const { t, resourceLabel } = useLanguage();
  const { playerName } = useAuth();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cities = useGameStore((s) => s.cities);
  const playerCities = useGameStore((s) => s.playerCities);
  const setActiveCity = useGameStore((s) => s.setActiveCity);
  const budgetSpendFloats = useGameStore((s) => s.budgetSpendFloats ?? STORE_EMPTY_ARRAY);
  const rawResources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const resources = rawResources.map((r) => (
    r.id === 'money'
      ? { ...r, current: getEmpireMoneyTotal(cities), empireShared: true }
      : r
  ));
  const activeCity = useGameStore((s) => s.cities[s.activeCityId]);
  const flashes = useGameStore((s) => s.flashes);
  const valueFlashes = useResourceValueFlashes(resources);
  const workforceShortage = hasWorkforceShortage(activeCity);
  const protectionEndsAt = useGameStore((s) => s.protectionEndsAt);
  const peaceActive = isPeaceForceProtected(protectionEndsAt);
  const peaceCountdown = formatPeaceForceCountdown(protectionEndsAt);
  const visibleResources = resources.filter((r) => r.id !== 'uranium');

  const cityCount = playerCities.length;
  const activeCityIndex = playerCities.findIndex((c) => c.id === activeCityId);
  const cycleCity = (delta) => {
    if (cityCount < 2) return;
    const next = (activeCityIndex + delta + cityCount) % cityCount;
    setActiveCity(playerCities[next].id);
  };

  const energyRes = resources.find((r) => r.id === 'energy');
  const energyCrisis = energyRes != null && energyRes.current < 0;

  const hasResources = visibleResources.length > 0;
  const showSyncOnly = !gameReady && !hasResources;
  const rowResources = pickResourcesByIds(visibleResources, RESOURCE_ROW_TOP);
  const resourceRenderProps = {
    flashes,
    valueFlashes,
    energyCrisis,
    budgetSpendFloats,
    resourceLabel,
    t,
  };

  if (showSyncOnly) {
    return (
      <header
        ref={barRef}
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
      ref={barRef}
      className={[
        'resource-bar',
        'resource-bar--tactical',
        'resource-bar--command',
        'resource-bar--stacked',
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
      <div
        className={[
          'resource-bar-inner',
          'resource-bar-inner--flush',
          'resource-bar-inner--grid',
          peaceActive && 'resource-bar-inner--has-peace',
        ].filter(Boolean).join(' ')}
      >
        <div className="resource-bar-meta-row">
          <div className="resource-bar-top-col resource-bar-top-col--left">
            <div className="brand-block brand-desktop resource-bar-brand">
              <span className="game-title">{GAME_NAME}</span>
              {!gameReady && hasResources && (
                <span className="resource-bar-sync-line resource-bar-sync-line--inline">{t('resourceBar.syncing')}</span>
              )}
            </div>
          </div>
        </div>

        {peaceActive && (
          <div className="resource-bar-peace-row" role="status">
            <span
              className="protection-badge protection-badge--active protection-badge--bar-inline"
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
          </div>
        )}

        <div className="resource-bar-lang-clock resource-bar-lang-clock--dock" aria-label="Dil ve sunucu saati">
          <LanguageSwitcher className="lang-switcher--bar lang-switcher--bar-compact" compact />
          <ServerTimeClock />
        </div>

        <div className="resource-bar-main-row">
          <div id="resource-bar-city-switch" className="city-switcher-wrap resource-bar-city-col">
            <button
              type="button"
              className="city-cycle-btn"
              onClick={() => cycleCity(-1)}
              disabled={cityCount < 2}
              aria-label={t('cityManagement.prevCity')}
              title={t('cityManagement.prevCity')}
            >
              ‹
            </button>
            <label className="city-switcher">
              <span className="sr-only">{t('resourceBar.activeCity')}</span>
              <CustomDropdown
                className="city-switcher-select"
                value={activeCityId}
                onChange={setActiveCity}
                aria-label={t('resourceBar.activeCity')}
                options={playerCities.map((c) => ({
                  value: c.id,
                  label: formatCityOptionLabel(c),
                }))}
              />
            </label>
            <button
              type="button"
              className="city-cycle-btn"
              onClick={() => cycleCity(1)}
              disabled={cityCount < 2}
              aria-label={t('cityManagement.nextCity')}
              title={t('cityManagement.nextCity')}
            >
              ›
            </button>
          </div>
          <div className="resource-bar-resources resource-bar-resources--strip" aria-label={t('resourceBar.resources')}>
            <div className="resources-row resources-row--single" role="list">
              {renderResourceItems({ items: rowResources, ...resourceRenderProps })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

