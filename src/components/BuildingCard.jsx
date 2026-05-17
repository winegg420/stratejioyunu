import { formatSeconds } from '../lib/gameUtils';
import { useGameStore } from '../stores/gameStore';

export default function BuildingCard({ building }) {
  const queue = useGameStore((s) => s.cities[s.activeCityId]?.constructionQueue ?? []);
  const active = queue.find((q) => !q.queued && (q.buildingId === building.id || q.name === building.name));
  const upgrading = Boolean(building.upgrading) || Boolean(active);
  const remaining = active?.remainingSeconds ?? 0;

  return (
    <article className={`card building-card ${upgrading ? 'upgrading' : ''}`}>
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
        {upgrading && (
          <div className="stat highlight">
            <span className="stat-label">Kalan</span>
            <span className="stat-value timer">{formatSeconds(remaining)}</span>
          </div>
        )}
      </div>
      {building.cost !== '—' && <p className="card-cost">Maliyet: {building.cost}</p>}
      <div className="card-actions">
        <button type="button" className="btn btn-primary" disabled={upgrading}>
          {upgrading ? 'Yükseltiliyor...' : 'Yükselt'}
        </button>
        <button type="button" className="btn btn-secondary">Kuyruğa Ekle</button>
      </div>
    </article>
  );
}
