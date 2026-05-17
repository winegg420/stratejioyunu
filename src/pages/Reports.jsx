import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ReportFilters from '../components/ReportFilters';
import ReportDetail from '../components/ReportDetail';
import { reports } from '../data/placeholder';

export default function Reports() {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const counts = useMemo(
    () => ({
      all: reports.length,
      battle: reports.filter((r) => r.filterType === 'battle').length,
      spy: reports.filter((r) => r.filterType === 'spy').length,
    }),
    [],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter((r) => r.filterType === filter);
  }, [filter]);

  const toggleDetail = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="page">
      <PageHeader title="Raporlar" subtitle="Savaş, keşif ve ticaret raporları." />
      {reports.length > 0 ? (
        <>
          <ReportFilters active={filter} onChange={setFilter} counts={counts} />
          <ul className="report-list">
            {filtered.map((r) => (
              <li key={r.id} className={`report-item${expandedId === r.id ? ' report-item--open' : ''}`}>
                <span className={`report-type report-type--${r.filterType}`}>{r.type}</span>
                <div className="report-main">
                  <strong>{r.title}</strong>
                  <span className="report-date">{r.date}</span>
                </div>
                <p className="report-preview">{r.preview}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleDetail(r.id)}
                  aria-expanded={expandedId === r.id}
                >
                  {expandedId === r.id ? 'Gizle' : 'Detay'}
                </button>
                {expandedId === r.id && <ReportDetail report={r} />}
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p className="report-filter-empty">Bu filtrede rapor bulunamadı.</p>
          )}
        </>
      ) : (
        <EmptyState
          icon="📋"
          title="Henüz raporunuz yok"
          description="Sefer, keşif ve casusluk operasyonları tamamlandığında detaylı raporlar burada görünür."
          actionLabel="Haritaya Git"
          actionTo="/harita"
        />
      )}
    </div>
  );
}
