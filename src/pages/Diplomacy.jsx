import { useEffect, useMemo, useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import EmptyState from '../components/EmptyState';
import { diplomacy } from '../data/placeholder';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import PageSessionGate from '../components/PageSessionGate';
import { useLanguage } from '../context/LanguageContext';
import {
  TREATY_KIND,
  TREATY_LABELS,
  TREATY_STATUS,
  formatTreatyDurationHours,
  isTreatyActive,
  parseTreatyEndsAt,
  tickTreatyExpiry,
} from '../lib/diplomaticAgreements';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { saveDiplomaticTreaties } from '../lib/historyBookStorage';

function confirmBreakTreaty(partner, t) {
  return window.confirm(t('pages.diplomacy.confirmBreakPact', { partner }));
}

function PactRow({ treaty, onBreak, t }) {
  const endsAt = parseTreatyEndsAt(treaty.endsAt);
  const endsLabel = endsAt != null
    ? new Date(endsAt).toLocaleString('tr-TR')
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
        className="btn btn-secondary btn-sm diplomacy-pact-row__break"
        onClick={() => {
          if (!confirmBreakTreaty(treaty.partner, t)) return;
          onBreak(treaty.partner);
        }}
      >
        {t('pages.diplomacy.breakPact')}
      </button>
    </li>
  );
}

function isCeasefireTreaty(treaty) {
  const kind = treaty.kind ?? (treaty.type === 'Ateşkes' ? TREATY_KIND.CEASEFIRE : null);
  return kind === TREATY_KIND.CEASEFIRE || treaty.type === TREATY_LABELS[TREATY_KIND.CEASEFIRE];
}

function isCeasefireExpired(treaty, now) {
  if (!isCeasefireTreaty(treaty)) return false;
  if (treaty.status === TREATY_STATUS.EXPIRED) return true;
  const endsAt = parseTreatyEndsAt(treaty.endsAt);
  if (treaty.status === TREATY_STATUS.ACTIVE && endsAt != null && endsAt <= now) return true;
  return false;
}

export default function Diplomacy() {
  const { t } = useLanguage();
  const { alliance, votes } = diplomacy;
  const now = useGameStore((s) => s.now);
  const diplomaticTreaties = useGameStore((s) => s.diplomaticTreaties ?? STORE_EMPTY_ARRAY);
  const breakDiplomaticTreaty = useGameStore((s) => s.breakDiplomaticTreaty);
  const proposeDiplomaticAgreement = useGameStore((s) => s.proposeDiplomaticAgreement);
  const acceptDiplomaticAgreement = useGameStore((s) => s.acceptDiplomaticAgreement);
  const rejectDiplomaticAgreement = useGameStore((s) => s.rejectDiplomaticAgreement);

  const [partner, setPartner] = useState('KaraKurt');
  const [ceasefireHours, setCeasefireHours] = useState('48');
  const [napHours, setNapHours] = useState('');

  const playerName = getCurrentPlayerName();

  useEffect(() => {
    const tick = tickTreatyExpiry(useGameStore.getState().diplomaticTreaties ?? [], now);
    if (!tick.changed) return;
    useGameStore.setState({ diplomaticTreaties: tick.treaties });
    saveDiplomaticTreaties(playerName, tick.treaties);
  }, [now, playerName]);

  const activeTreaties = diplomaticTreaties.filter((t) => t.status === TREATY_STATUS.ACTIVE);
  const pendingIncoming = diplomaticTreaties.filter(
    (t) => t.status === TREATY_STATUS.PENDING && t.proposer !== playerName,
  );
  const pendingOutgoing = diplomaticTreaties.filter(
    (t) => t.status === TREATY_STATUS.PENDING && t.proposer === playerName,
  );

  const expiredCeasefires = useMemo(
    () => diplomaticTreaties.filter((treaty) => isCeasefireExpired(treaty, now)),
    [diplomaticTreaties, now],
  );

  const handleProposeCeasefire = () => {
    const hours = Number(ceasefireHours) || 48;
    const ok = window.confirm(
      t('pages.diplomacy.confirmCeasefire', { partner, hours }),
    );
    if (!ok) return;
    proposeDiplomaticAgreement({
      partner,
      kind: TREATY_KIND.CEASEFIRE,
      durationHours: hours,
    });
  };

  const handleProposeNap = () => {
    const hours = napHours ? Number(napHours) : null;
    const ok = window.confirm(
      t('pages.diplomacy.confirmNap', { partner, duration: hours ? `${hours} saat` : 'süresiz' }),
    );
    if (!ok) return;
    proposeDiplomaticAgreement({
      partner,
      kind: TREATY_KIND.NAP,
      durationHours: hours,
    });
  };

  return (
    <PageSessionGate loadingMessageKey="auth.syncingGame">
    <div className="page page--console diplomacy-page">
      <LocalizedPageHeader
        className="diplomacy-page-header"
        pageKey="diplomacy"
        hideStatus
        feedPending={false}
      />

      {expiredCeasefires.length > 0 && (
        <div className="diplomacy-ceasefire-expired-banners" role="alert">
          {expiredCeasefires.map((treaty) => {
            const endsAt = parseTreatyEndsAt(treaty.endsAt);
            const endsLabel = endsAt != null
              ? new Date(endsAt).toLocaleDateString('tr-TR')
              : '—';
            return (
              <p key={treaty.id ?? `${treaty.partner}-ceasefire-expired`} className="diplomacy-ceasefire-expired-banner">
                <strong>{treaty.partner}</strong>
                {' '}
                ile ateşkes sona erdi
                {endsLabel !== '—' ? ` (${endsLabel})` : ''}
                {' '}
                — yenile veya boz
              </p>
            );
          })}
        </div>
      )}

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
          {activeTreaties.filter((tr) => isTreatyActive(tr, now)).length > 0 ? (
            <ul className="diplomacy-pact-list treaty-list">
              {activeTreaties.filter((tr) => isTreatyActive(tr, now)).map((treaty) => (
                <PactRow
                  key={treaty.id ?? treaty.partner}
                  treaty={treaty}
                  t={t}
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
              onClick={handleProposeCeasefire}
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
              onClick={handleProposeNap}
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
            {pendingIncoming.map((tr) => (
              <li key={tr.id} className="diplomacy-pending-row">
                <span>
                  {tr.proposer} → {tr.type}
                  {' '}
                  ({formatTreatyDurationHours(
                    tr.endsAt ? Math.round((parseTreatyEndsAt(tr.endsAt) - Date.now()) / 3600000) : 0,
                  )})
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => acceptDiplomaticAgreement(tr.id)}
                >
                  Onayla
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => rejectDiplomaticAgreement(tr.id)}
                >
                  Reddet
                </button>
              </li>
            ))}
            {pendingOutgoing.map((tr) => (
              <li key={tr.id} className="diplomacy-pending-row diplomacy-pending-row--out">
                <span>Giden: {tr.type} → {tr.partner}</span>
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
          <EmptyState
            tag="[ OYLAMA YOK ]"
            icon="🗳️"
            title="Aktif oylama yok"
            description="Oy kullanmak için ittifak üyelerinin önerdiği oylamalara katıl"
          />
        )}
      </section>
    </div>
    </PageSessionGate>
  );
}
