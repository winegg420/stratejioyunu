import PageHeader from '../components/PageHeader';
import { tradeOffers } from '../data/placeholder';

export default function Trade() {
  return (
    <div className="page">
      <PageHeader
        title="Ticaret"
        subtitle="Açık pazar ilanları ve ikili ticaret teklifleri."
        action={<button type="button" className="btn btn-primary">İlan Ver</button>}
      />
      <section className="panel">
        <h3 className="panel-title">Açık Pazar</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Satıcı</th>
              <th>Satıyor</th>
              <th>İstiyor</th>
              <th>Oran</th>
              <th>Mesafe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tradeOffers.map((o) => (
              <tr key={o.id}>
                <td>{o.seller}</td>
                <td>{o.sell}</td>
                <td>{o.want}</td>
                <td>{o.ratio}</td>
                <td>{o.distance}</td>
                <td><button type="button" className="btn btn-primary btn-sm">Kabul Et</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <h3 className="panel-title">Aktif Kervanlar</h3>
        <p className="muted">Örnek: Manisa → İzmir · 2.000 Metal · Varış: 01:22:00</p>
      </section>
    </div>
  );
}
