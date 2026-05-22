import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { diplomacy } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';
import {
  TREATY_KIND,
  TREATY_LABELS,
  TREATY_STATUS,
  formatTreatyDurationHours,
} from '../lib/diplomaticAgreements';
import { getCurrentPlayerName } from '../lib/playerIdentity';

const DIPLOMACY_FEED = '> KÜRESEL DİPLOMASİ HATTI: SENKRONİZE';

function PactRow({ treaty, onBreak }) {
  const endsLabel = treaty.endsAt
    ? new Date(treaty.endsAt).toLocaleString('tr-TR')
    : 'Süresiz';
  return (
    <li className="diplomacy-pact-row diplomacy-pact-row--active">
      <span className="diplomacy-pact-row__dot" aria-hidden="true" />
      <div className="diplomacy-pact-row__body">
        <strong className="diplomacy-pact-row__type">{treaty.type}</strong>
        <span className="diplomacy-pact-row__partner">{treaty.partner}</span>
        <span className="diplomacy-pact-row__ends font-hud-data">Bitiş: {endsLabel}</span>
      </div>
      <button
        type="button"
        className="btn btn-danger btn-sm diplomacy-pact-row__break"
        onClick={() => onBreak(treaty.partner)}
      >
        Anlaşmayı boz
      </button>
    </li>
  );
}

export default function Diplomacy() {
  const { alliance, votes } = diplomacy;
  const diplomaticTreaties = useGameStore((s) => s.diplomaticTreaties ?? []);
  const breakDiplomaticTreaty = useGameStore((s) => s.breakDiplomaticTreaty);
  const proposeDiplomaticAgreement = useGameStore((s) => s.proposeDiplomaticAgreement);
  const acceptDiplomaticAgreement = useGameStore((s) => s.acceptDiplomaticAgreement);
  const rejectDiplomaticAgreement = useGameStore((s) => s.rejectDiplomaticAgreement);

  const [partner, setPartner] = useState('KaraKurt');
  const [ceasefireHours, setCeasefireHours] = useState('48');
  const [napHours, setNapHours] = useState('');

  const playerName = getCurrentPlayerName();
  const activeTreaties = diplomaticTreaties.filter((t) => t.status === TREATY_STATUS.ACTIVE);
  const pendingIncoming = diplomaticTreaties.filter(
    (t) => t.status === TREATY_STATUS.PENDING && t.proposer !== playerName,
  );
  const pendingOutgoing = diplomaticTreaties.filter(
    (t) => t.status === TREATY_STATUS.PENDING && t.proposer === playerName,
  );

  return (
    <div className="page page--console diplomacy-page">
      <PageHeader
        className="diplomacy-page-header"
        title="Diplomasi"
        hideStatus
        feedLine={DIPLOMACY_FEED}
        feedPending={false}
      />

      <div className="diplomacy-grid two-col">
        <section className="panel diplomacy-panel diplomacy-panel--alliance">
          <h3 className="panel-title diplomacy-panel__title">İttifak: {alliance.name}</h3>
          <dl className="info-dl diplomacy-info-dl">
            <dt>Üye</dt>
            <dd>{alliance.members}</dd>
            <dt>Mod</dt>
            <dd>{alliance.mode}</dd>
            <dt>Lider</dt>
            <dd>{alliance.leader}</dd>
          </dl>
        </section>

        <section className="panel diplomacy-panel diplomacy-panel--pacts">
          <h3 className="panel-title diplomacy-panel__title diplomacy-panel__title--pacts">
            Yürürlükteki Anlaşmalar
          </h3>
          <p className="hint diplomacy-panel__hint">
            Ateşkes ve saldırmazlık pakti bağlayıcıdır. Bozmak veya saldırmak itibar kaybettirir.
          </p>
          {activeTreaties.length > 0 ? (
            <ul className="diplomacy-pact-list treaty-list">
              {activeTreaties.map((t) => (
                <PactRow
                  key={t.id ?? t.partner}
                  treaty={t}
                  onBreak={breakDiplomaticTreaty}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              tag="[ ANLAŞMA YOK ]"
              icon="🤝"
              title="Aktif anlaşma yok"
              description="Resmi şablonlardan ateşkes veya NAP teklifi gönderin."
            />
          )}
        </section>
      </div>

      <section className="panel diplomacy-panel diplomacy-panel--templates">
        <h3 className="panel-title">Resmi Anlaşma Şablonları</h3>
        <label className="diplomacy-form-field">
          <span>Oyuncu / devlet</span>
          <input
            className="input-qty"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
          />
        </label>

        <div className="diplomacy-template-grid">
          <article className="diplomacy-template-card">
            <h4>{TREATY_LABELS[TREATY_KIND.CEASEFIRE]}</h4>
            <p className="hint">
              Süre belirleyin; karşı taraf onaylayınca sistem otomatik uygular.
            </p>
            <label>
              <span>Süre (saat)</span>
              <input
                type="number"
                className="input-qty"
                min={1}
                value={ceasefireHours}
                onChange={(e) => setCeasefireHours(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary diplomacy-action-btn"
              onClick={() => proposeDiplomaticAgreement({
                partner,
                kind: TREATY_KIND.CEASEFIRE,
                durationHours: Number(ceasefireHours) || 48,
              })}
            >
              [ ATEŞKES TEKLİF ET ]
            </button>
          </article>

          <article className="diplomacy-template-card">
            <h4>{TREATY_LABELS[TREATY_KIND.NAP]}</h4>
            <p className="hint">
              Karşılıklı imza gerekir. Süre boş bırakılırsa süresiz NAP.
            </p>
            <label>
              <span>Süre (saat, isteğe bağlı)</span>
              <input
                type="number"
                className="input-qty"
                min={0}
                value={napHours}
                onChange={(e) => setNapHours(e.target.value)}
                placeholder="Süresiz"
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary diplomacy-action-btn"
              onClick={() => proposeDiplomaticAgreement({
                partner,
                kind: TREATY_KIND.NAP,
                durationHours: napHours ? Number(napHours) : null,
              })}
            >
              [ NAP TEKLİF ET ]
            </button>
          </article>
        </div>
      </section>

      {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
        <section className="panel">
          <h3 className="panel-title">Bekleyen Teklifler</h3>
          <ul className="diplomacy-pending-list">
            {pendingIncoming.map((t) => (
              <li key={t.id} className="diplomacy-pending-row">
                <span>
                  {t.proposer} → {t.type}
                  {' '}
                  ({formatTreatyDurationHours(
                    t.endsAt ? Math.round((t.endsAt - Date.now()) / 3600000) : 0,
                  )})
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => acceptDiplomaticAgreement(t.id)}
                >
                  Onayla
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => rejectDiplomaticAgreement(t.id)}
                >
                  Reddet
                </button>
              </li>
            ))}
            {pendingOutgoing.map((t) => (
              <li key={t.id} className="diplomacy-pending-row diplomacy-pending-row--out">
                <span>Giden: {t.type} → {t.partner}</span>
                <span className="muted">Yanıt bekleniyor</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel diplomacy-panel">
        <h3 className="panel-title diplomacy-panel__title">Aktif Oylamalar</h3>
        {votes.length > 0 ? (
          votes.map((v) => (
            <div key={v.title} className="vote-row">
              <span>{v.title}</span>
              <span>{v.votes}</span>
              <span className="timer">Bitiş: {v.ends}</span>
            </div>
          ))
        ) : (
          <EmptyState tag="[ OYLAMA YOK ]" icon="🗳️" title="Aktif oylama yok" />
        )}
      </section>
    </div>
  );
}
