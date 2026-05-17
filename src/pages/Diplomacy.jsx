import PageHeader from '../components/PageHeader';
import { diplomacy } from '../data/placeholder';

const TEMPLATES = [
  'İttifak teklif ediyorum',
  'Savaş ilan ediyorum',
  'Harac teklif ediyorum',
  'Ateşkes istiyorum',
  'Ticaret yapalım',
];

export default function Diplomacy() {
  const { alliance, treaties, votes } = diplomacy;

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
          <ul className="treaty-list">
            {treaties.map((t) => (
              <li key={t.partner}>
                <strong>{t.type}</strong> — {t.partner}
                <span className="badge">{t.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="panel">
        <h3 className="panel-title">Aktif Oylamalar</h3>
        {votes.map((v) => (
          <div key={v.title} className="vote-row">
            <span>{v.title}</span>
            <span>{v.votes}</span>
            <span className="timer">Bitiş: {v.ends}</span>
            <button type="button" className="btn btn-primary btn-sm">Oy Ver</button>
          </div>
        ))}
      </section>
      <section className="panel">
        <h3 className="panel-title">Diplomatik Şablonlar</h3>
        <div className="template-btns">
          {TEMPLATES.map((t) => (
            <button key={t} type="button" className="btn btn-secondary">{t}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
