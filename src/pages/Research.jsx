import PageHeader from '../components/PageHeader';
import { researches } from '../data/placeholder';
import { useCountdown } from '../hooks/useCountdown';

function ResearchCard({ item }) {
  const timer = useCountdown(item.active ? item.time : '—');
  return (
    <article className={`card ${item.active ? 'upgrading' : ''}`}>
      <ResearchCardHeader item={item} timer={timer} />
      <p className="card-desc">{item.desc}</p>
      <p className="card-cost">Maliyet: {item.cost}</p>
      <div className="card-actions">
        <button type="button" className="btn btn-primary" disabled={item.active}>
          {item.active ? 'Araştırılıyor...' : 'Araştır'}
        </button>
        <button type="button" className="btn btn-secondary">Kuyruğa Ekle</button>
      </div>
    </article>
  );
}

function ResearchCardHeader({ item, timer }) {
  return (
    <div className="card-header">
      <h3>{item.name}</h3>
      <span className="badge">Sv. {item.level} / {item.max}</span>
      {item.active && <span className="timer-badge">{timer}</span>}
    </div>
  );
}

export default function Research() {
  return (
    <div className="page">
      <PageHeader title="Araştırma" subtitle="Aynı anda 1 araştırma. Araştırma Merkezi seviyesi limit belirler." />
      <div className="card-grid">
        {researches.map((r) => (
          <ResearchCard key={r.id} item={r} />
        ))}
      </div>
    </div>
  );
}
