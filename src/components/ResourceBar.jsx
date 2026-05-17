import { resources, GAME_NAME, CITY_NAME, PLAYER_NAME, PROTECTION_DAYS } from '../data/placeholder';

export default function ResourceBar() {
  return (
    <header className="resource-bar">
      <div className="brand-block">
        <span className="game-title">{GAME_NAME}</span>
        <span className="city-label">📍 {CITY_NAME}</span>
      </div>
      <div className="resources-row">
        {resources.map((r) => {
          const pct = r.max ? Math.min(100, (r.current / r.max) * 100) : 100;
          return (
            <ResourceItem key={r.id} r={r} pct={pct} />
          );
        })}
      </div>
      <div className="player-block">
        <span className="player-name">👤 {PLAYER_NAME}</span>
        <span className="protection-badge">🛡️ Koruma: {PROTECTION_DAYS} gün</span>
      </div>
    </header>
  );
}

function ResourceItem({ r, pct }) {
  return (
    <div className="resource-item" title={r.label}>
      <span className="res-icon">{r.icon}</span>
      <div className="res-body">
        <span className="res-label">{r.label}</span>
        <span className="res-value">
          {r.current.toLocaleString('tr-TR')}
          {r.max && ` / ${r.max.toLocaleString('tr-TR')}`}
        </span>
        {r.max && (
          <div className="res-bar">
            <div className={`res-fill ${pct > 85 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <span className="res-rate">{r.rate}</span>
      </div>
    </div>
  );
}
