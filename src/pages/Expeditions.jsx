import PageHeader from '../components/PageHeader';
import { activeExpeditions, pastExpeditions } from '../data/placeholder';

export default function Expeditions() {
  return (
    <div className="page">
      <PageHeader
        title="Seferler"
        subtitle="Sefer saldırısı ve meydan savaşı. İlk 5 dakika içinde iptal edilebilir."
        action={<button type="button" className="btn btn-primary">Yeni Sefer Gönder</button>}
      />
      <section className="panel">
        <h3 className="panel-title">Aktif Seferler</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Hedef</th>
              <th>Oyuncu</th>
              <th>Tür</th>
              <th>Birim</th>
              <th>Mesafe</th>
              <th>Varış</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {activeExpeditions.map((e) => (
              <tr key={e.id}>
                <td>{e.target}</td>
                <td>{e.player}</td>
                <td>{e.type}</td>
                <td>{e.units} birim</td>
                <td>{e.distance}</td>
                <td className="timer">{e.eta}</td>
                <td>
                  {e.cancellable ? (
                    <button type="button" className="btn btn-danger btn-sm">İptal (5 dk)</button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <h3 className="panel-title">Geçmiş Seferler</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Hedef</th>
              <th>Sonuç</th>
              <th>Ganimet</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {pastExpeditions.map((e) => (
              <tr key={e.id}>
                <td>{e.target}</td>
                <td><span className={e.result === 'Zafer' ? 'text-win' : 'text-loss'}>{e.result}</span></td>
                <td>{e.loot}</td>
                <td>{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="hint">Minimum sefer birliği: 10 asker. Sefer spam önlemi için zorunludur.</p>
    </div>
  );
}
