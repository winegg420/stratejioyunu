import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useResourceStore } from '../stores/resourceStore';
import { GAME_NAME, CITY_NAME, PROTECTION_DAYS } from '../data/placeholder';
import NotificationBell from './NotificationBell';

function formatShort(n) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('tr-TR');
}

function ResourceItem({ resource, pct, flash }) {
  return (
    <div
      className={`resource-item${flash ? ' resource-flash' : ''}`}
      title={`${resource.label}: ${resource.current.toLocaleString('tr-TR')}`}
    >
      <span className="res-icon" aria-hidden="true">
        {resource.icon}
      </span>
      <div className="res-body">
        <span className="res-label">{resource.label}</span>
        <span className="res-value">
          {formatShort(resource.current)}
          {resource.max && <span className="res-max"> / {formatShort(resource.max)}</span>}
        </span>
        {resource.max && (
          <div className="res-bar">
            <div
              className={`res-fill ${pct > 85 ? 'warn' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceBar() {
  const { playerName } = useAuth();
  const resources = useResourceStore((s) => s.resources);
  const flashes = useResourceStore((s) => s.flashes);
  const startTicker = useResourceStore((s) => s.startTicker);

  useEffect(() => startTicker(), [startTicker]);

  return (
    <header className="resource-bar">
      <div className="resource-bar-inner">
        <div className="brand-block brand-desktop">
          <span className="game-title">{GAME_NAME}</span>
          <span className="city-label">📍 {CITY_NAME}</span>
        </div>
        <div className="resources-row">
          {resources.map((r) => {
            const pct = r.max ? Math.min(100, (r.current / r.max) * 100) : 100;
            return (
              <ResourceItem
                key={r.id}
                resource={r}
                pct={pct}
                flash={Boolean(flashes[r.id])}
              />
            );
          })}
        </div>
        <div className="resource-bar-actions">
          <NotificationBell />
          <div className="player-block player-desktop">
            <span className="player-name">👤 {playerName}</span>
            <span className="protection-badge">🛡️ {PROTECTION_DAYS}g</span>
          </div>
        </div>
      </div>
    </header>
  );
}
