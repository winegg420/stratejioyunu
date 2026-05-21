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

export default function Diplomacy() {
  const { alliance, votes } = diplomacy;
  const diplomaticTreaties = useGameStore((s) => s.diplomaticTreaties ?? []);
  const breakDiplomaticTreaty = useGameStore((s) => s.breakDiplomaticTreaty);
  const activeTreaties = diplomaticTreaties.filter((t) => t.status === 'active');

  return (
    <div className="page">
      <PageHeader title="Diplomasi" subtitle="İttifaklar, anlaşmalar, savaş ilanları ve oylamalar." />
      <div className="two-col">
        <section className="panel">
          <h3 className="panel-title">İttifak: {alliance.name}</h3>
          <dl className="info-dl">
            <dt>Üye</dt>
            <dd>{alliance.members}</dd>
            <dt>Mod</dt>
            <dd>{alliance.mode}</dd>
            <dt>Lider</dt>
            <dd>{alliance.leader}</dd>
          </dl>
          <div className="card-actions">
            <button type="button" className="btn btn-secondary">İttifak Sayfası</button>
            <button type="button" className="btn btn-secondary">Mesaj Gönder</button>
          </div>
        </section>
        <section className="panel">
          <h3 className="panel-title">Aktif Anlaşmalar</h3>
          <p className="hint">
            Pakt bozulduktan sonra eski müttefike saldırı — Devlet Tarih Kitabı&apos;na İhanet Kroniği düşer.
          </p>
          {activeTreaties.length > 0 ? (
            <ul className="treaty-list">
              {activeTreaties.map((t) => (
                <li key={t.id ?? t.partner}>
                  <strong>{t.type}</strong>
                  {' '}
                  — {t.partner}
                  {t.partnerAlliance && t.partnerAlliance !== '—' && (
                    <span className="hint"> ({t.partnerAlliance})</span>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => breakDiplomaticTreaty(t.partner)}
                  >
                    Paktı boz
                  </button>
                </li>
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
      <section className="panel">
        <h3 className="panel-title">Aktif Oylamalar</h3>
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
      <section className="panel">
        <h3 className="panel-title">Diplomatik Şablonlar</h3>
        <div className="template-btns">
          {TEMPLATES.map((t) => (
            <button key={t} type="button" className="btn btn-secondary">
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
