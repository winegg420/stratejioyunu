const FILTERS = [
  { id: 'all', label: 'Hepsi' },
  { id: 'operations', label: 'Operasyon Geçmişi' },
  { id: 'battle', label: 'Savaş' },
  { id: 'spy', label: 'Casusluk' },
  { id: 'cyber', label: 'Siber Ops' },
  { id: 'kbrn', label: 'KBRN' },
  { id: 'trade', label: 'Ticaret' },
  { id: 'logistics', label: 'Lojistik' },
];

export default function ReportFilters({ active, onChange, counts }) {
  return (
    <div className="report-filters" role="tablist" aria-label="Rapor filtresi">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={active === f.id}
          className={`report-filter-btn${active === f.id ? ' active' : ''}`}
          onClick={() => onChange(f.id)}
        >
          {f.label}
          {counts[f.id] != null && <span className="report-filter-count">{counts[f.id]}</span>}
        </button>
      ))}
    </div>
  );
}
