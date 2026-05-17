import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { intelOps } from '../data/placeholder';

const OPS = [
  { name: 'Keşif Ajanı', desc: 'Rakibin asker sayısını öğren' },
  { name: 'Sabotaj', desc: 'Rakibin binasını hasarla' },
  { name: 'Sızma Timi', desc: 'Rakibin planını öğren' },
  { name: 'Provokasyon', desc: 'Vassalini isyan ettir' },
  { name: 'Siber Saldırı', desc: 'Üretimi geçici durdur' },
];

export default function Intelligence() {
  return (
    <div className="page">
      <PageHeader title="İstihbarat" subtitle="Casus gönder, raporları incele, karşı istihbarat durumunu takip et." />
      <div className="two-col">
        <section className="panel">
          <h3 className="panel-title">Yeni Operasyon</h3>
          <ul className="ops-list">
            {OPS.map((op) => (
              <li key={op.name}>
                <strong>{op.name}</strong>
                <span>{op.desc}</span>
                <button type="button" className="btn btn-primary btn-sm">Gönder</button>
              </li>
            ))}
          </ul>
          <p className="hint">İstihbarat Merkezi Sv.6 — Karşı istihbarat: %42 yakalama şansı</p>
        </section>
        <section className="panel">
          <h3 className="panel-title">Aktif / Tamamlanan Operasyonlar</h3>
          {intelOps.length > 0 ? (
            <ul className="intel-list">
              {intelOps.map((op) => (
                <li key={op.id}>
                  <strong>{op.type}</strong>
                  <span>{op.target}</span>
                  <span className="badge">{op.status}</span>
                  {op.eta && <span className="timer">{op.eta}</span>}
                  {op.result && <p>{op.result}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="🕵️"
              title="Casus operasyonu yok"
              description="Haritadan bir düşman şehrine casus göndererek asker ve bina bilgisi toplayabilirsiniz."
              actionLabel="Haritayı Aç"
              actionTo="/harita"
            />
          )}
        </section>
      </div>
    </div>
  );
}
