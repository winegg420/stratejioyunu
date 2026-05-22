import { useEffect, useState } from 'react';
import { useActionLock } from '../hooks/useActionLock';
import { remainingFromEndsAt } from '../lib/gameUtils';
import { canAffordCost } from '../utils/resourceCosts';
import BuildingRequirementTooltip from './BuildingRequirementTooltip';
import { STORE_EMPTY_ARRAY, useGameStore, useConstructionQueueFull } from '../stores/gameStore';
import {
  arePrerequisitesMet,
  BUILDING_LABELS,
  getUnmetPrerequisites,
} from '../lib/buildingUtils';
import { getBuildingVisual } from '../data/buildingVisualCatalog';
import { resolveNextConstructionSpec } from '../data/buildingCatalog';
import {
  AI_CENTER_BUILDING_ID,
  formatAiCenterStatus,
  getAiCenterEnergyDemandHourly,
  getAiCenterLevel,
} from '../lib/aiCenterEngine';
import { resolveBuildingInfoPayload } from '../lib/contentInfoResolver';
import BuildCountdownHud from './BuildCountdownHud';

export default function BuildingCard({ building, progressionLock = null }) {
  const now = useGameStore((s) => s.now);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const queue = useGameStore((s) => s.cities[s.activeCityId]?.constructionQueue ?? STORE_EMPTY_ARRAY);
  const enqueueConstruction = useGameStore((s) => s.enqueueConstruction);
  const cancelConstruction = useGameStore((s) => s.cancelConstruction);
  const openContentInfo = useGameStore((s) => s.openContentInfo);
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
  const progressionBlocked = Boolean(progressionLock);
  const canBuild = Boolean(nextSpec) && !upgrading && canAfford && !queueFull && prereqsMet && !progressionBlocked;
  const blockedLabel = unmetPrereqs.length
    ? `[ SEKTÖR KİLİTLİ: ${unmetPrereqs
      .map((req) => `${(BUILDING_LABELS[req.id] ?? req.id).toUpperCase()} SV.${req.level} GEREKLİ`)
      .join(' · ')} ]`
    : '[ SEKTÖR KİLİTLİ ]';
  const currentLevel = building.level ?? 0;
  const targetLevel = nextSpec?.targetLevel ?? currentLevel + 1;
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
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [building.id, visual?.image]);

  const handleImgError = () => {
    setImgFailed(true);
  };

  const openInfo = () => {
    if (city) openContentInfo(resolveBuildingInfoPayload(building, city));
  };

  const card = (
    <article
      id={`building-card-${building.id}`}
      className={[
        'card',
        'building-card',
        'building-card--steel',
        'content-card--slim',
        upgrading && 'upgrading',
        isBlocked && 'building-card--blocked',
        isUnbuilt && 'building-card--unbuilt',
        isUnbuilt && prereqsMet && 'building-card--starter',
        progressionBlocked && 'building-card--progression-locked',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="building-lvl-rozet" aria-label={`Seviye ${currentLevel}`}>
        [ LVL {currentLevel} ]
      </span>
      <span className="content-card__intel-badge">[ i ]</span>
      {queueBadge && (
        <span
          className={`building-queue-badge${queueEntry.queued ? ' building-queue-badge--queued' : ' building-queue-badge--active'}`}
        >
          {queueBadge}
        </span>
      )}
      {progressionBlocked && (
        <span className="building-lock-badge building-lock-badge--progression" title={progressionLock}>
          [ KİLİTLİ: {progressionLock} ]
        </span>
      )}
      {isBlocked && !progressionBlocked && (
        <span className="building-lock-badge" title={blockedLabel}>
          [ KİLİTLİ: ÖN KOŞULLAR ]
        </span>
      )}
      <button type="button" className="content-card__intel-hit" onClick={openInfo} aria-label={`${building.name} ansiklopedi`}>
        <div className={`card-visual${visual ? ' card-visual--building' : ''}`}>
          {visual && !imgFailed ? (
            <>
              <div
                className={[
                  'building-img-wrap',
                  'building-img-wrap--cell-grid',
                  building.id === 'barracks' && 'building-img-wrap--barracks',
                  building.id === 'depot' && 'building-img-wrap--depot',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <img
                  src={visual.image}
                  alt=""
                  className="building-card__img"
                  loading="lazy"
                  decoding="async"
                  onError={handleImgError}
                />
              </div>
            </>
          ) : visual ? (
            <div className="building-img-wrap building-card__silhouette-fallback" aria-hidden="true">
              {building.image}
            </div>
          ) : (
            <span className="building-card__emoji">{building.image}</span>
          )}
        </div>
        <div className="content-card__head">
          <h3>{building.name}</h3>
          <span className="building-level-badge">
            Sv.{currentLevel}
            {nextSpec && currentLevel > 0 && (
              <span className="building-next-level">→ Sv.{targetLevel}</span>
            )}
          </span>
        </div>
      </button>
      {upgrading && (
        <p className="content-card__meta">
          Kalan: <BuildCountdownHud remaining={remaining} />
        </p>
      )}
      {displayCost ? (
        <p className="content-card__meta">
          {isUnbuilt ? 'İnşaat' : 'Yükseltme'} maliyeti: <strong>{displayCost}</strong>
          {nextSpec?.time ? ` · ${nextSpec.time}` : ''}
        </p>
      ) : (
        <p className="content-card__meta">Maliyet tanımlı değil</p>
      )}
      {building.id === AI_CENTER_BUILDING_ID && getAiCenterLevel(city) >= 1 && (
        <p className="content-card__meta content-card__meta--ai">
          ⚡ Tüketim: {getAiCenterEnergyDemandHourly(getAiCenterLevel(city))}/sa · {formatAiCenterStatus(city)}
        </p>
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
