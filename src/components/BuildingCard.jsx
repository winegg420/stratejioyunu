import { useCountdown } from '../hooks/useCountdown';

export default function BuildingCard({ building }) {
  const timer = useCountdown(building.upgrading ? building.time : '—');

  return (
    <article className={`card building-card ${building.upgrading ? 'upgrading' : ''}`}>
      <div className="card-visual">{building.image}</div>
      <div className="card-header">
        <h3>{building.name}</h3>
        <span className="badge">{building.category}</span>
      </div>
      <p className="card-desc">{building.desc}</p>
      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">Seviye</span>
          <span className="stat-value">{building.level}</span>
        </div>
        {building.upgrading && (
          <div className="stat highlight">
            <span className="stat-label">Kalan</span>
            <span className="stat-value timer">{timer}</span>
          </div>
        )}
      </div>
      {building.cost !== '—' && <p className="card-cost">Maliyet: {building.cost}</p>}
      <div className="card-actions">
        <button type="button" className="btn btn-primary" disabled={building.upgrading}>
          {building.upgrading ? 'Yükseltiliyor...' : 'Yükselt'}
        </button>
        <button type="button" className="btn btn-secondary">Kuyruğa Ekle</button>
      </div>
    </article>
  );
}
