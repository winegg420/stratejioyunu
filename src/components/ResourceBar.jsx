import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameStore } from '../stores/gameStore';
import { GAME_NAME, PROTECTION_DAYS } from '../data/placeholder';
import NotificationBell from './NotificationBell';

const DEPOT_WARN_PCT = 90;

function formatShort(n) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('tr-TR');
}

function ResourceItem({ resource, pct, flash, depotWarn }) {
  const hasDepot = resource.max != null;

  return (
    <div
      className={[
        'resource-item',
        hasDepot && 'has-depot',
        flash && 'resource-flash',
        depotWarn && 'depot-warn',
      ]
        .filter(Boolean)
        .join(' ')}
      title={`${resource.label}: ${resource.current.toLocaleString('tr-TR')}${hasDepot ? ` / ${resource.max.toLocaleString('tr-TR')}` : ''}`}
    >
      <span className="res-icon" aria-hidden="true">
        {resource.icon}
      </span>
      <div className="res-body">
        <span className="res-label">{resource.label}</span>
        <span className="res-value">
          {formatShort(resource.current)}
          {hasDepot && <span className="res-max"> / {formatShort(resource.max)}</span>}
        </span>
        {hasDepot && (
          <div className="res-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="res-fill" style={{ width: `${pct}%` }} />
          </div>
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
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? []);
  const flashes = useGameStore((s) => s.flashes);
  const startTicker = useGameStore((s) => s.startTicker);

  useEffect(() => startTicker(), [startTicker]);

  return (
    <header className="resource-bar">
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
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="resources-row">
          {resources.map((r) => {
            const pct = r.max ? Math.min(100, (r.current / r.max) * 100) : 100;
            const depotWarn = r.max != null && pct >= DEPOT_WARN_PCT;
            return (
              <ResourceItem
                key={r.id}
                resource={r}
                pct={pct}
                flash={Boolean(flashes[r.id])}
                depotWarn={depotWarn}
              />
            );
          })}
        </div>
        <div className="resource-bar-actions">
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
