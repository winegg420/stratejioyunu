import { useAuth } from '../context/AuthContext';
import { STORE_EMPTY_ARRAY, useGameStore, formatCityOptionLabel } from '../stores/gameStore';
import { isDepotOverflow, WORKFORCE_PENALTY_LABEL, hasWorkforceShortage } from '../lib/resourceProduction';
import { formatCompactNumber } from '../lib/formatNumber';
import { GAME_NAME, PROTECTION_DAYS } from '../data/placeholder';
import NotificationBell from './NotificationBell';
import ServerTimeClock from './ServerTimeClock';

const DEPOT_WARN_PCT = 90;

function ResourceItem({ resource, pct, flash, depotWarn, depotOverflow, energyCrisis }) {
  const hasDepot = resource.max != null;
  const frozen = resource.productionFrozen || depotOverflow;
  const workforceCut = resource.workforcePenalty && !frozen;

  return (
    <div
      className={[
        'resource-item',
        hasDepot && 'has-depot',
        flash && 'resource-flash',
        depotWarn && !depotOverflow && 'depot-warn',
        depotOverflow && 'depot-overflow',
        workforceCut && 'resource-item--workforce',
        energyCrisis && 'resource-item--energy-crisis',
      ]
        .filter(Boolean)
        .join(' ')}
      title={`${resource.label}: ${resource.current.toLocaleString('tr-TR')}${hasDepot ? ` / ${resource.max.toLocaleString('tr-TR')}` : ''}${depotOverflow ? ' — depo taştı, üretim durdu' : ''}${workforceCut ? ` — ${WORKFORCE_PENALTY_LABEL}` : ''}${energyCrisis ? ' — enerji krizi' : ''}`}
    >
      <span className="res-icon" aria-hidden="true">
        {resource.icon}
      </span>
      <div className="res-body">
        <span className="res-label">{resource.label}</span>
        <span className="res-value font-hud-data">
          {formatCompactNumber(resource.current)}
          {hasDepot && <span className="res-max"> / {formatCompactNumber(resource.max)}</span>}
          {frozen && <span className="res-stgn-badge">[ STGN ]</span>}
        </span>
        {hasDepot && (
          <div className="res-bar" role="progressbar" aria-valuenow={Math.min(100, pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="res-fill" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        )}
        <span className={`res-rate font-hud-data${frozen ? ' res-rate--stopped' : ''}`}>
          {frozen ? 'DURDU' : resource.rate}
        </span>
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
    <header className={`resource-bar${workforceShortage ? ' resource-bar--workforce-warn' : ''}`}>
      {workforceShortage && (
        <p className="resource-bar-workforce-warn" role="status">
          {WORKFORCE_PENALTY_LABEL}
        </p>
      )}
      <div className="resource-bar-inner">
        <div className="brand-block brand-desktop">
          <span className="game-title">{GAME_NAME}</span>
          <label className="city-switcher">
            <span className="sr-only">Aktif sehir</span>
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
        <div className="resources-row">
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
        <div className="resource-bar-actions">
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
