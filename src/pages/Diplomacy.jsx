import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { diplomacy } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';

const TEMPLATES = [
  'İttifak teklif ediyorum',
  'Savaş ilan ediyorum',
  'Harac teklif ediyorum',
  'Ateşkes istiyorum',
  'Ticaret yapalım',
];

const DIPLOMACY_FEED = '> KÜRESEL DİPLOMASİ HATTI: SENKRONİZE';

function PactRow({ treaty, onBreak }) {
  return (
    <li className="diplomacy-pact-row diplomacy-pact-row--active">
      <span className="diplomacy-pact-row__dot" aria-hidden="true" />
      <div className="diplomacy-pact-row__body">
        <strong className="diplomacy-pact-row__type">{treaty.type}</strong>
        <span className="diplomacy-pact-row__partner">{treaty.partner}</span>
        {treaty.partnerAlliance && treaty.partnerAlliance !== '—' && (
          <span className="diplomacy-pact-row__alliance">{treaty.partnerAlliance}</span>
        )}
      </div>
      <span className="diplomacy-pact-row__link font-hud-data">[ BAĞLANTI: STABİL ]</span>
      <button
        type="button"
        className="btn btn-danger btn-sm diplomacy-pact-row__break"
        onClick={() => onBreak(treaty.partner)}
      >
        Paktı boz
      </button>
    </li>
  );
}

export default function Diplomacy() {
  const { alliance, votes } = diplomacy;
  const diplomaticTreaties = useGameStore((s) => s.diplomaticTreaties ?? []);
  const breakDiplomaticTreaty = useGameStore((s) => s.breakDiplomaticTreaty);
  const activeTreaties = diplomaticTreaties.filter((t) => t.status === 'active');

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
          <div className="diplomacy-panel__actions card-actions">
            <button type="button" className="btn btn-primary diplomacy-action-btn">
              [ YENİ İTTİFAK KUR ]
            </button>
            <button type="button" className="btn btn-secondary diplomacy-action-btn">
              İttifak Sayfası
            </button>
            <button type="button" className="btn btn-secondary diplomacy-action-btn">
              Mesaj Gönder
            </button>
          </div>
        </section>

        <section className="panel diplomacy-panel diplomacy-panel--pacts">
          <h3 className="panel-title diplomacy-panel__title diplomacy-panel__title--pacts">
            Yürürlükteki Paktlar
          </h3>
          <p className="hint diplomacy-panel__hint">
            Pakt bozulduktan sonra eski müttefike saldırı — Devlet Tarih Kitabı&apos;na İhanet Kroniği düşer.
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
              description="Diğer oyuncularla ittifak, ateşkes veya ticaret anlaşması yapabilirsiniz."
              actionLabel="Mesajlar"
              actionTo="/mesajlar"
            />
          )}
        </section>
      </div>

      <section className="panel diplomacy-panel">
        <h3 className="panel-title diplomacy-panel__title">Aktif Oylamalar</h3>
        {votes.length > 0 ? (
          votes.map((v) => (
            <div key={v.title} className="vote-row">
              <span>{v.title}</span>
              <span>{v.votes}</span>
              <span className="timer">Bitiş: {v.ends}</span>
              <button type="button" className="btn btn-primary btn-sm">Oy Ver</button>
            </div>
          ))
        ) : (
          <EmptyState
            tag="[ OYLAMA YOK ]"
            icon="🗳️"
            title="Aktif oylama yok"
            description="İttifakınızda üyelik veya karar oylamaları başladığında burada görünür."
          />
        )}
      </section>

      <section className="panel diplomacy-panel diplomacy-panel--templates">
        <h3 className="panel-title diplomacy-panel__title">Diplomatik Şablonlar</h3>
        <div className="template-btns diplomacy-template-btns">
          {TEMPLATES.map((t) => (
            <button key={t} type="button" className="btn btn-secondary diplomacy-template-btn">
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
