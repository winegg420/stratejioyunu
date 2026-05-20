import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { resolveResearchInfoPayload } from '../lib/contentInfoResolver';
import { RESEARCH_BUILDING_ID } from '../lib/buildingUtils';
import {
  isKbrnBranchUnlocked,
  KBRN_CATEGORY,
  KBRN_RESEARCH_CENTER_UNLOCK,
  scaleKbrnResearchCost,
} from '../lib/kbrnResearch';
import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';
import { canAffordCost } from '../utils/resourceCosts';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';

function ResearchCard({ item, kbrnLocked }) {
  const now = useGameStore((s) => s.now);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const enqueueResearch = useGameStore((s) => s.enqueueResearch);
  const startQueuedResearch = useGameStore((s) => s.startQueuedResearch);
  const cancelResearch = useGameStore((s) => s.cancelResearch);
  const openContentInfo = useGameStore((s) => s.openContentInfo);

  const displayCost = item.category === KBRN_CATEGORY
    ? scaleKbrnResearchCost(item.cost, item.level ?? 0)
    : item.cost;

  const hasActive = researches.some((r) => r.active);
  const remaining = item.active ? remainingFromEndsAt(item.endsAt, now) : 0;
  const canAfford = displayCost !== '—' && canAffordCost(displayCost, 1, resources);
  const branchBlocked = item.category === KBRN_CATEGORY && kbrnLocked;
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
        item.active && 'upgrading',
        item.queued && 'is-queued',
        branchBlocked && 'card--kbrn-locked',
      ].filter(Boolean).join(' ')}
    >
      <span className="content-card__intel-badge">[ i ]</span>
      <button type="button" className="content-card__intel-hit" onClick={openInfo} aria-label={`${item.name} ansiklopedi`}>
        <div className="card-visual-research" aria-hidden="true">
          {item.category === KBRN_CATEGORY ? '☢️' : '🔬'}
        </div>
        <div className="content-card__head">
          <h3>{item.name}</h3>
          <span className="badge">Sv. {item.level} / {item.max}</span>
          {item.category === KBRN_CATEGORY && <span className="badge badge--kbrn">KBRN</span>}
          {item.active && <span className="timer-badge">{formatSeconds(remaining)}</span>}
          {item.queued && <span className="timer-badge">Sırada</span>}
        </div>
      </button>
      {branchBlocked ? (
        <p className="content-card__meta hint card-kbrn-lock">
          Kilitli — Ar-Ge Sv.{KBRN_RESEARCH_CENTER_UNLOCK}+
        </p>
      ) : (
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

  return (
    <LockedFeatureGate buildingId={RESEARCH_BUILDING_ID} featureName={item.name}>
      {card}
    </LockedFeatureGate>
  );
}

export default function Research() {
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const city = useActiveCity();
  const kbrnUnlocked = isKbrnBranchUnlocked(city);

  const { standard, kbrn } = useMemo(() => {
    const std = researches.filter((r) => r.category !== KBRN_CATEGORY);
    const kb = researches.filter((r) => r.category === KBRN_CATEGORY);
    return { standard: std, kbrn: kb };
  }, [researches]);

  return (
    <div className="page page--research">
      <PageHeader
        title="Araştırma"
        subtitle="Standart askeri teknolojiler ve ileri KBRN savunma/taktik dalı."
      />
      <section className="research-section">
        <h2 className="panel-title">Askeri Teknolojiler</h2>
        <div className="card-grid">
          {standard.map((r) => (
            <ResearchCard key={r.id} item={r} kbrnLocked={false} />
          ))}
        </div>
      </section>

      <section className="research-section research-section--kbrn">
        <h2 className="panel-title">
          KBRN Savunma & Taktik
          {!kbrnUnlocked && (
            <span className="research-kbrn-gate">
              {' '}(Ar-Ge Sv.{KBRN_RESEARCH_CENTER_UNLOCK}+)
            </span>
          )}
        </h2>
        <p className="hint research-kbrn-intro">
          Kimyasal, biyolojik, radyolojik ve nükleer protokoller — geçici lojistik felç;
          kalıcı bina yıkımı yok. En yüksek araştırma maliyeti.
        </p>
        <div className="card-grid">
          {kbrn.map((r) => (
            <ResearchCard key={r.id} item={r} kbrnLocked={!kbrnUnlocked} />
          ))}
        </div>
      </section>
    </div>
  );
}
