import { resources, GAME_NAME, CITY_NAME, PLAYER_NAME, PROTECTION_DAYS } from '../data/placeholder';

function formatShort(n) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('tr-TR');
}

function ResourceItem({ r, pct }) {
  return (
    <div className="resource-item" title={`${r.label}: ${r.current.toLocaleString('tr-TR')}`}>
      <span className="res-icon" aria-hidden="true">{r.icon}</span>
      <div className="res-body">
        <span className="res-label">{r.label}</span>
        <span className="res-value">
          {formatShort(r.current)}
          {r.max && <span className="res-max"> / {formatShort(r.max)}</span>}
        </span>
        {r.max && (
          <div className="res-bar">
            <div className={`res-fill ${pct > 85 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceBar() {
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
            return <ResourceItem key={r.id} r={r} pct={pct} />;
          })}
        </div>
        <div className="player-block player-desktop">
          <span className="player-name">👤 {PLAYER_NAME}</span>
          <span className="protection-badge">🛡️ {PROTECTION_DAYS}g</span>
        </div>
      </div>
    </header>
  );
}
