import PageHeader from '../components/PageHeader';
import CostBreakdown from '../components/CostBreakdown';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { RESEARCH_BUILDING_ID } from '../lib/buildingUtils';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { canAffordCost } from '../utils/resourceCosts';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';

function ResearchCard({ item }) {
  const now = useGameStore((s) => s.now);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const enqueueResearch = useGameStore((s) => s.enqueueResearch);
  const startQueuedResearch = useGameStore((s) => s.startQueuedResearch);
  const cancelResearch = useGameStore((s) => s.cancelResearch);

  const hasActive = researches.some((r) => r.active);
  const remaining = item.active ? remainingFromEndsAt(item.endsAt, now) : 0;
  const canAfford = item.cost !== '—' && canAffordCost(item.cost, 1, resources);
  const canStart = !item.active && !item.queued && canAfford && !hasActive;
  const canQueue = !item.active && !item.queued && canAfford && hasActive;

  const card = (
    <article className={`card ${item.active ? 'upgrading' : ''} ${item.queued ? 'is-queued' : ''}`}>
      <div className="card-header">
        <h3>{item.name}</h3>
        <span className="badge">Sv. {item.level} / {item.max}</span>
        {item.active && <span className="timer-badge">{formatSeconds(remaining)}</span>}
        {item.queued && <span className="timer-badge">Sırada</span>}
      </div>
      <p className="card-desc">{item.desc}</p>
      <p className="card-cost">Maliyet: {item.cost}</p>
      <CostBreakdown costStr={item.cost} qty={1} resources={resources} />
      <div className="card-actions">
        {item.queued ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={hasActive}
            onClick={() => startQueuedResearch(item.id)}
          >
            Başlat
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={!canStart} onClick={() => enqueueResearch(item.id)}>
            {item.active ? 'Araştırılıyor...' : 'Araştır'}
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!canQueue || item.active || item.queued}
          onClick={() => enqueueResearch(item.id, { addToQueue: true })}
        >
          Kuyruğa Ekle
        </button>
        {(item.active || item.queued) && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => cancelResearch(item.id)}>
            İptal
          </button>
        )}
      </div>
    </article>
  );

  return (
    <LockedFeatureGate buildingId={RESEARCH_BUILDING_ID} featureName={item.name}>
      {card}
    </LockedFeatureGate>
  );
}

export default function Research() {
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);

  return (
    <div className="page">
      <PageHeader
        title="Araştırma"
        subtitle="Araştırmalar otomatik başlamaz — Araştırma Merkezi inşa edildikten sonra kullanılır."
      />
      <div className="card-grid">
        {researches.map((r) => (
          <ResearchCard key={r.id} item={r} />
        ))}
      </div>
    </div>
  );
}
