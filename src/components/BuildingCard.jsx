import { useActionLock } from '../hooks/useActionLock';
import { remainingFromEndsAt } from '../lib/gameUtils';
import { canAffordCost } from '../utils/resourceCosts';
import CostBreakdown from './CostBreakdown';
import BuildingRequirementTooltip from './BuildingRequirementTooltip';
import { STORE_EMPTY_ARRAY, useGameStore, useConstructionQueueFull } from '../stores/gameStore';
import {
  arePrerequisitesMet,
  BUILDING_LABELS,
  formatPrerequisiteList,
  getUnmetPrerequisites,
} from '../lib/buildingUtils';
import { getBuildingVisual } from '../data/buildingVisualCatalog';
import { resolveNextConstructionSpec } from '../data/buildingCatalog';
import BuildCountdownHud from './BuildCountdownHud';

export default function BuildingCard({ building }) {
  const now = useGameStore((s) => s.now);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const queue = useGameStore((s) => s.cities[s.activeCityId]?.constructionQueue ?? STORE_EMPTY_ARRAY);
  const enqueueConstruction = useGameStore((s) => s.enqueueConstruction);
  const cancelConstruction = useGameStore((s) => s.cancelConstruction);
  const queueFull = useConstructionQueueFull();
  const { locked: actionLocked, runLocked } = useActionLock();

  const queueEntry = queue.find(
    (q) => q.buildingId === building.id || q.name === building.name,
  );
  const active = queue.find((q) => !q.queued && (q.buildingId === building.id || q.name === building.name));
  const upgrading = Boolean(building.upgrading) || Boolean(active);
  const remaining = active ? remainingFromEndsAt(active.endsAt, now) : 0;
  const prereqsMet = arePrerequisitesMet(city, building.id);
  const unmetPrereqs = getUnmetPrerequisites(city, building.id);
  const nextSpec = resolveNextConstructionSpec(building);
  const displayCost = nextSpec?.cost ?? null;
  const canAfford = displayCost && canAffordCost(displayCost, 1, resources);
  const isUnbuilt = building.level < 1;
  const isBlocked = !prereqsMet;
  const canBuild = Boolean(nextSpec) && !upgrading && canAfford && !queueFull && prereqsMet;
  const blockedLabel = unmetPrereqs.length
    ? `[ SEKTÖR KİLİTLİ: ${(BUILDING_LABELS[unmetPrereqs[0].id] ?? unmetPrereqs[0].id).toUpperCase()} SV.${unmetPrereqs[0].level} ]`
    : '[ SEKTÖR KİLİTLİ ]';
  const queueBadge = queueEntry ? (queueEntry.queued ? 'Sırada' : 'Yükseltiliyor') : null;

  const upgradeLabel = queueFull
    ? 'İnşaat Sırası Dolu'
    : upgrading
      ? 'Yükseltiliyor...'
      : !prereqsMet
        ? 'Ön Koşul Eksik'
        : isUnbuilt
          ? '[ İNŞA ET ]'
          : 'Yükselt';

  const handleUpgrade = () => {
    runLocked(() => enqueueConstruction(building.id));
  };
  const handleQueue = () => {
    runLocked(() => enqueueConstruction(building.id, { addToQueue: true }));
  };
  const buildBusy = actionLocked || upgrading;
  const visual = getBuildingVisual(building.id);

  const card = (
    <article
      id={`building-card-${building.id}`}
      className={[
        'card',
        'building-card',
        upgrading && 'upgrading',
        isBlocked && 'building-card--blocked',
        isUnbuilt && 'building-card--unbuilt',
        isUnbuilt && prereqsMet && 'building-card--starter',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {queueBadge && (
        <span
          className={`building-queue-badge${queueEntry.queued ? ' building-queue-badge--queued' : ' building-queue-badge--active'}`}
        >
          {queueBadge}
        </span>
      )}
      {isBlocked && (
        <div className="building-blocked-overlay" aria-hidden="true">
          <span className="building-blocked-label">{blockedLabel}</span>
        </div>
      )}
      <div className={`card-visual${visual ? ' card-visual--building' : ''}`}>
        {visual ? (
          <>
            <div
              className={`building-img-wrap${building.id === 'barracks' ? ' building-img-wrap--barracks' : ''}`}
            >
              <img
                src={visual.image}
                alt=""
                className="building-card__img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="building-designation">{visual.designation}</p>
          </>
        ) : (
          <span className="building-card__emoji">{building.image}</span>
        )}
      </div>
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
          <div className="stat highlight stat--countdown">
            <span className="stat-label">Kalan</span>
            <BuildCountdownHud remaining={remaining} />
          </div>
        )}
      </div>
      {displayCost ? (
        <>
          <p className="card-cost">
            Maliyet
            {isUnbuilt ? ' (Sv.1 inşaat)' : ` (Sv.${nextSpec.targetLevel})`}
            : {displayCost}
          </p>
          <CostBreakdown costStr={displayCost} qty={1} resources={resources} />
        </>
      ) : (
        <p className="card-cost card-cost--missing">Maliyet tanımlı değil</p>
      )}
      {isUnbuilt && !prereqsMet && unmetPrereqs.length > 0 && (
        <p className="building-lock-label">{formatPrerequisiteList(unmetPrereqs)}</p>
      )}
      <div className="card-actions">
        {upgrading && queueEntry && (
          <button
            type="button"
            className="btn btn-hud-danger btn-sm building-cancel-btn"
            disabled={actionLocked}
            onClick={() => cancelConstruction(queueEntry.id)}
          >
            [ İPTAL ET ]
          </button>
        )}
        <button
          type="button"
          className={`btn btn-hud-primary btn-primary${isUnbuilt && prereqsMet ? ' btn-build-start' : ''}${actionLocked ? ' btn-hud-loading' : ''}`}
          disabled={!canBuild || buildBusy}
          onClick={handleUpgrade}
        >
          {actionLocked ? 'Yükleniyor…' : upgradeLabel}
        </button>
        <button
          type="button"
          className={`btn btn-hud-secondary btn-secondary${actionLocked ? ' btn-hud-loading' : ''}`}
          disabled={!canAfford || !prereqsMet || queueFull || actionLocked}
          onClick={handleQueue}
        >
          Kuyruğa Ekle
        </button>
      </div>
    </article>
  );

  return <BuildingRequirementTooltip building={building}>{card}</BuildingRequirementTooltip>;
}
