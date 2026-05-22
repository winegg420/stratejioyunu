import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import LockedFeatureGate from '../components/LockedFeatureGate';
import ResearchRequirementTooltip from '../components/ResearchRequirementTooltip';
import { resolveResearchInfoPayload } from '../lib/contentInfoResolver';
import { RESEARCH_BUILDING_ID } from '../lib/buildingUtils';
import {
  isKbrnBranchUnlocked,
  KBRN_RESEARCH_CENTER_UNLOCK,
  scaleAdvancedResearchCost,
} from '../lib/kbrnResearch';
import { ADVANCED_RESEARCH_CATEGORY } from '../data/researchCatalog';
import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';
import { canAffordCost } from '../utils/resourceCosts';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import ResearchBlueprintIcon from '../components/ResearchBlueprintIcon';
import '../styles/research-blueprint-icons.css';

function AdvancedLockWarn() {
  return (
    <span className="research-section__lock-warn" title="Ar-Ge Merkezi Sv.8+ gerekli">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3L4 7v6c0 5 3.5 8.5 8 9.5M12 3l8 4v6c0 5-3.5 8.5-8 9.5M12 3v18"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <rect x="10" y="11" width="4" height="5" rx="0.5" fill="currentColor" opacity="0.85" />
      </svg>
      Kilitli
    </span>
  );
}

function ResearchCard({ item, advancedLocked }) {
  const now = useGameStore((s) => s.now);
  const city = useActiveCity();
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const enqueueResearch = useGameStore((s) => s.enqueueResearch);
  const startQueuedResearch = useGameStore((s) => s.startQueuedResearch);
  const cancelResearch = useGameStore((s) => s.cancelResearch);
  const openContentInfo = useGameStore((s) => s.openContentInfo);

  const isAdvanced = item.category === ADVANCED_RESEARCH_CATEGORY || item.category === 'kbrn';
  const displayCost = scaleAdvancedResearchCost(item.cost, item.level ?? 0, item.category);

  const hasActive = researches.some((r) => r.active);
  const remaining = item.active ? remainingFromEndsAt(item.endsAt, now) : 0;
  const canAfford = displayCost !== '—' && canAffordCost(displayCost, 1, resources);
  const branchBlocked = isAdvanced && advancedLocked;
  const canStart = !branchBlocked && !item.active && !item.queued && canAfford && !hasActive;
  const canQueue = !branchBlocked && !item.active && !item.queued && canAfford && hasActive;

  const openInfo = () => {
    if (city) openContentInfo(resolveResearchInfoPayload(item, city));
  };

  const card = (
    <article
      className={[
        'card',
        'content-card--slim',
        'content-card--research',
        isAdvanced && 'content-card--research-advanced',
        item.active && 'upgrading',
        item.queued && 'is-queued',
        branchBlocked && 'card--kbrn-locked',
      ].filter(Boolean).join(' ')}
    >
      {isAdvanced && <span className="research-card__advanced-rozet">[ İLERİ ]</span>}
      <span className="content-card__intel-badge">[ i ]</span>
      <button type="button" className="content-card__intel-hit" onClick={openInfo} aria-label={`${item.name} ansiklopedi`}>
        <div className="card-visual-research" aria-hidden="true">
          <ResearchBlueprintIcon researchId={item.id} />
        </div>
        <div className="content-card__head">
          <h3>{item.name}</h3>
          <span className="badge">Sv. {item.level} / {item.max}</span>
          {item.active && <span className="timer-badge">{formatSeconds(remaining)}</span>}
          {item.queued && <span className="timer-badge">Sırada</span>}
        </div>
      </button>
      {!branchBlocked && (
        <p className="content-card__meta">
          Maliyet: <strong>{displayCost}</strong>
        </p>
      )}
      <div className="card-actions">
        {item.queued ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={hasActive || branchBlocked}
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
          disabled={!canQueue || item.active || item.queued || branchBlocked}
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

  const wrapped = branchBlocked && city ? (
    <ResearchRequirementTooltip item={item} city={city} kbrnBranchLocked={advancedLocked}>
      {card}
    </ResearchRequirementTooltip>
  ) : (
    card
  );

  return (
    <LockedFeatureGate buildingId={RESEARCH_BUILDING_ID} featureName={item.name} hideHint>
      {wrapped}
    </LockedFeatureGate>
  );
}

export default function Research() {
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const city = useActiveCity();
  const advancedUnlocked = isKbrnBranchUnlocked(city);

  const { core, advanced } = useMemo(() => {
    const coreList = researches.filter(
      (r) => r.category !== ADVANCED_RESEARCH_CATEGORY && r.category !== 'kbrn',
    );
    const advList = researches.filter(
      (r) => r.category === ADVANCED_RESEARCH_CATEGORY || r.category === 'kbrn',
    );
    return { core: coreList, advanced: advList };
  }, [researches]);

  return (
    <div className="page page--console page--research">
      <PageHeader
        title="Araştırma"
        subtitle="> Ar-Ge modülleri taranıyor — 12 askeri doktrin blueprint veritabanı hazır..."
      />
      <section className="research-section">
        <h2 className="panel-title research-section__title">[ STANDART DOKTRİNLER ]</h2>
        <div className="card-grid">
          {core.map((r) => (
            <ResearchCard key={r.id} item={r} advancedLocked={false} />
          ))}
        </div>
      </section>

      <section className="research-section research-section--kbrn">
        <h2 className="panel-title research-section__title">
          {!advancedUnlocked && <AdvancedLockWarn />}
          [ İLERİ SEVİYE — AR-GE MERKEZİ SV.8+ GEREKLİ ]
        </h2>
        <div className="research-kbrn-hover-panel" role="note">
          <p className="hint research-kbrn-intro">
            KBRN, nükleer sanayi, balistik ve yapay zeka protokolleri — en yüksek maliyetli dal.
            {!advancedUnlocked && (
              <> Ar-Ge Merkezi Sv.{KBRN_RESEARCH_CENTER_UNLOCK}+ gerekir.</>
            )}
          </p>
        </div>
        <div className="card-grid">
          {advanced.map((r) => (
            <ResearchCard key={r.id} item={r} advancedLocked={!advancedUnlocked} />
          ))}
        </div>
      </section>
    </div>
  );
}
