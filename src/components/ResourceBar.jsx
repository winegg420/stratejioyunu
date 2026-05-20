import { useAuth } from '../context/AuthContext';
import { STORE_EMPTY_ARRAY, useGameStore, formatCityOptionLabel } from '../stores/gameStore';
import { isDepotOverflow, WORKFORCE_PENALTY_LABEL, hasWorkforceShortage } from '../lib/resourceProduction';
import { formatCompactNumber } from '../lib/formatNumber';
import { formatHourlyProduction } from '../lib/hourlyProduction';
import { GAME_NAME, PROTECTION_DAYS } from '../data/placeholder';
import NotificationBell from './NotificationBell';
import ServerTimeClock from './ServerTimeClock';

const DEPOT_WARN_PCT = 90;

function ResourceItem({ resource, pct, flash, depotWarn, depotOverflow, energyCrisis }) {
  const hasDepot = resource.max != null;
  const frozen = resource.productionFrozen || depotOverflow;
  const workforceCut = resource.workforcePenalty && !frozen;
  const hourlyLabel = !frozen ? formatHourlyProduction(resource) : null;

  return (
    <div
      className={[
        'resource-item',
        'resource-item--tactical',
        hasDepot && 'has-depot',
        flash && 'resource-flash',
        depotWarn && !depotOverflow && 'depot-warn',
        depotOverflow && 'depot-overflow',
        workforceCut && 'resource-item--workforce',
        energyCrisis && 'resource-item--energy-crisis',
      ]
        .filter(Boolean)
        .join(' ')}
      title={`${resource.label}: ${resource.current.toLocaleString('tr-TR')}${hasDepot ? ` / ${resource.max.toLocaleString('tr-TR')}` : ''}${hourlyLabel ? ` · ${hourlyLabel}` : ''}${depotOverflow ? ' — depo taştı, üretim durdu' : ''}${workforceCut ? ` — ${WORKFORCE_PENALTY_LABEL}` : ''}${energyCrisis ? ' — enerji krizi' : ''}`}
    >
      <span className="res-icon" aria-hidden="true">
        {resource.icon}
      </span>
      <div className="res-body">
        <span className="res-label">{resource.label}</span>
        <span className="res-value">
          {formatCompactNumber(resource.current)}
          {hasDepot && <span className="res-max"> / {formatCompactNumber(resource.max)}</span>}
          {frozen && <span className="res-stgn-badge">[ STGN ]</span>}
        </span>
        {hasDepot && (
          <div
            className="res-bar"
            role="progressbar"
            aria-valuenow={Math.min(100, pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="res-fill" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        )}
        {hourlyLabel ? (
          <span className="res-hourly-live">{hourlyLabel}</span>
        ) : (
          <span className={`res-rate${frozen ? ' res-rate--stopped' : ''}`}>
            {frozen ? 'DURDU' : '—'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResourceBar() {
  const { playerName } = useAuth();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const setActiveCity = useGameStore((s) => s.setActiveCity);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const activeCity = useGameStore((s) => s.cities[s.activeCityId]);
  const flashes = useGameStore((s) => s.flashes);
  const workforceShortage = hasWorkforceShortage(activeCity);

  const energyRes = resources.find((r) => r.id === 'energy');
  const energyCrisis = energyRes != null && energyRes.current < 0;

  return (
    <header
      className={[
        'resource-bar',
        'resource-bar--tactical',
        workforceShortage && 'resource-bar--workforce-warn',
      ]
        .filter(Boolean)
        .join(' ')}
      role="banner"
    >
      {workforceShortage && (
        <p className="resource-bar-workforce-warn" role="status">
          {WORKFORCE_PENALTY_LABEL}
        </p>
      )}
      <div className="resource-bar-inner resource-bar-inner--flush">
        <div className="brand-block brand-desktop resource-bar-brand">
          <span className="game-title">{GAME_NAME}</span>
          <label className="city-switcher">
            <span className="sr-only">Aktif şehir</span>
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

        <div className="resources-row resources-row--tactical" role="list" aria-label="Kaynaklar">
          {resources.map((r) => {
            const pct = r.max ? (r.current / r.max) * 100 : 100;
            const depotOverflow = isDepotOverflow(r);
            const depotWarn = r.max != null && pct >= DEPOT_WARN_PCT && !depotOverflow;
            return (
              <ResourceItem
                key={r.id}
                resource={r}
                pct={pct}
                flash={Boolean(flashes[r.id])}
                depotWarn={depotWarn}
                depotOverflow={depotOverflow}
                energyCrisis={r.id === 'energy' && energyCrisis}
              />
            );
          })}
        </div>

        <div className="resource-bar-actions resource-bar-actions--tactical">
          <ServerTimeClock />
          <NotificationBell />
          <div className="player-block player-desktop">
            <span className="player-name">{playerName}</span>
            <span className="protection-badge">{PROTECTION_DAYS}g koruma</span>
          </div>
        </div>
      </div>
    </header>
  );
}
