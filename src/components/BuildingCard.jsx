import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { canAffordCost } from '../utils/resourceCosts';
import CostBreakdown from './CostBreakdown';
import BuildingRequirementTooltip from './BuildingRequirementTooltip';
import { STORE_EMPTY_ARRAY, useGameStore, useConstructionQueueFull } from '../stores/gameStore';
import { arePrerequisitesMet } from '../lib/buildingUtils';

export default function BuildingCard({ building }) {
  const now = useGameStore((s) => s.now);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const queue = useGameStore((s) => s.cities[s.activeCityId]?.constructionQueue ?? STORE_EMPTY_ARRAY);
  const enqueueConstruction = useGameStore((s) => s.enqueueConstruction);
  const queueFull = useConstructionQueueFull();

  const queueEntry = queue.find(
    (q) => q.buildingId === building.id || q.name === building.name,
  );
  const active = queue.find((q) => !q.queued && (q.buildingId === building.id || q.name === building.name));
  const upgrading = Boolean(building.upgrading) || Boolean(active);
  const remaining = active ? remainingFromEndsAt(active.endsAt, now) : 0;
  const prereqsMet = arePrerequisitesMet(city, building.id);
  const canAfford = building.cost !== '—' && canAffordCost(building.cost, 1, resources);
  const isUnbuilt = building.level < 1;
  const canBuild = !upgrading && canAfford && !queueFull && prereqsMet;
  const queueBadge = queueEntry ? (queueEntry.queued ? 'Sırada' : 'Yükseltiliyor') : null;

  const upgradeLabel = queueFull
    ? 'İnşaat Sırası Dolu'
    : upgrading
      ? 'Yükseltiliyor...'
      : !prereqsMet
        ? 'Ön Koşul Eksik'
        : isUnbuilt
          ? 'İnşa Et'
          : 'Yükselt';

  const handleUpgrade = () => enqueueConstruction(building.id);
  const handleQueue = () => enqueueConstruction(building.id, { addToQueue: true });

  const card = (
    <article
      id={`building-card-${building.id}`}
      className={`card building-card ${upgrading ? 'upgrading' : ''} ${isUnbuilt ? 'building-card--unbuilt' : ''}`}
    >
      {queueBadge && (
        <span
          className={`building-queue-badge${queueEntry.queued ? ' building-queue-badge--queued' : ' building-queue-badge--active'}`}
        >
          {queueBadge}
        </span>
      )}
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
      {building.cost !== '—' && (
        <>
          <p className="card-cost">Maliyet: {building.cost}</p>
          <CostBreakdown costStr={building.cost} qty={1} resources={resources} />
        </>
      )}
      <div className="card-actions">
        <button type="button" className="btn btn-primary" disabled={!canBuild} onClick={handleUpgrade}>
          {upgradeLabel}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!canAfford || !prereqsMet || queueFull}
          onClick={handleQueue}
        >
          Kuyruğa Ekle
        </button>
      </div>
    </article>
  );

  return <BuildingRequirementTooltip building={building}>{card}</BuildingRequirementTooltip>;
}
