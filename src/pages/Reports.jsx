import PageHeader from '../components/PageHeader';
import { reports } from '../data/placeholder';

export default function Reports() {
  return (
    <div className="page">
      <PageHeader title="Raporlar" subtitle="Savaş, keşif ve ticaret raporları." />
      <ul className="report-list">
        {reports.map((r) => (
          <li key={r.id} className="report-item">
            <span className="report-type">{r.type}</span>
            <div className="report-main">
              <strong>{r.title}</strong>
              <span className="report-date">{r.date}</span>
            </div>
            <p>{r.preview}</p>
            <button type="button" className="btn btn-secondary btn-sm">Detay</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
