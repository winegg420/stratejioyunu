import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ReportFilters from '../components/ReportFilters';
import ReportDetail from '../components/ReportDetail';
import BattleSimulator from '../components/BattleSimulator';
import { useGameStore } from '../stores/gameStore';

export default function Reports() {
  const reports = useGameStore((s) => s.reports);
  const markReportsRead = useGameStore((s) => s.markReportsRead);
  const deleteReports = useGameStore((s) => s.deleteReports);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const counts = useMemo(
    () => ({
      all: reports.length,
      battle: reports.filter((r) => r.filterType === 'battle').length,
      spy: reports.filter((r) => r.filterType === 'spy').length,
      trade: reports.filter((r) => r.filterType === 'trade').length,
    }),
    [reports],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter((r) => r.filterType === filter);
  }, [filter, reports]);

  const toggleDetail = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deleteReports([...selectedIds]);
    setSelectedIds(new Set());
    setExpandedId(null);
  };

  const handleDeleteAll = () => {
    if (!reports.length) return;
    deleteReports('all');
    setSelectedIds(new Set());
    setExpandedId(null);
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  const handleMarkFilteredRead = () => {
    if (!filtered.length) return;
    markReportsRead(filtered.map((r) => r.id));
  };

  return (
    <div className="page">
      <PageHeader
        title="Raporlar"
        subtitle="Savaş, keşif ve ticaret raporları."
        action={reports.length > 0 ? (
          <div className="report-toolbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={filtered.length < 1}
              onClick={handleMarkFilteredRead}
            >
              Tümünü Okundu Say
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={selectedIds.size < 1}
              aria-disabled={selectedIds.size < 1}
              onClick={handleDeleteSelected}
            >
              Seçilenleri Sil ({selectedIds.size})
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteAll}>
              Tümünü Sil
            </button>
          </div>
        ) : null}
      />

      <BattleSimulator />

      {reports.length > 0 ? (
        <>
          <ReportFilters active={filter} onChange={setFilter} counts={counts} />
          <label className="report-select-all">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
            />
            Tümünü Seç
            {selectedIds.size > 0 && (
              <span className="report-select-count"> ({selectedIds.size} seçili)</span>
            )}
          </label>
          <ul className="report-list">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={`report-item${expandedId === r.id ? ' report-item--open' : ''}${r.isNew ? ' report-item--new' : ''}`}
              >
                <label className="report-select">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    aria-label={`${r.title} seç`}
                  />
                </label>
                <span className={`report-type report-type--${r.filterType}`}>{r.type}</span>
                <div className="report-main">
                  <strong>{r.title}</strong>
                  <span className="report-date">{r.date}</span>
                </div>
                <p className="report-preview">{r.preview}</p>
                <div className="report-item-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm report-item-detail-btn"
                    onClick={() => toggleDetail(r.id)}
                    aria-expanded={expandedId === r.id}
                  >
                    {expandedId === r.id ? 'Gizle' : 'Detay'}
                  </button>
                </div>
                {expandedId === r.id && (
                  <div className="report-detail-wrap">
                    <ReportDetail report={r} />
                    <div className="report-detail-footer">
                      <button
                        type="button"
                        className="btn btn-secondary report-detail-nav-btn"
                        onClick={() => setExpandedId(null)}
                      >
                        Kapat
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary report-detail-nav-btn"
                        onClick={() => setExpandedId(null)}
                      >
                        Geri Dön
                      </button>
                    </div>
                  </div>
                )}
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
