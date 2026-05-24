import { useEffect, useMemo, useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import EmptyState from '../components/EmptyState';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import ReportFilters from '../components/ReportFilters';
import ReportDetailModal from '../components/ReportDetailModal';
import CyberToggle from '../components/CyberToggle';
import { isOperationReport } from '../data/intelOperationsCatalog';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import PageSessionGate from '../components/PageSessionGate';
import { useLanguage } from '../context/LanguageContext';

export default function Reports() {
  const { t } = useLanguage();
  const reports = useGameStore((s) => s.reports);
  const gameHydrating = useGameStore((s) => s.gameHydrating);
  const refreshReportsFromServer = useGameStore((s) => s.refreshReportsFromServer);
  const reconcileReportsFromHistory = useGameStore((s) => s.reconcileReportsFromHistory);
  const pastExpeditions = useGameStore((s) => s.pastExpeditions ?? STORE_EMPTY_ARRAY);
  const markReportsRead = useGameStore((s) => s.markReportsRead);
  const deleteReports = useGameStore((s) => s.deleteReports);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (gameHydrating) return undefined;
    let cancelled = false;
    setReportsLoading(true);
    refreshReportsFromServer()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          reconcileReportsFromHistory();
          setReportsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [gameHydrating, refreshReportsFromServer, reconcileReportsFromHistory]);

  useEffect(() => {
    if (gameHydrating || reports.length > 0 || !pastExpeditions.length) return undefined;
    reconcileReportsFromHistory();
    return undefined;
  }, [gameHydrating, reports.length, pastExpeditions.length, reconcileReportsFromHistory]);

  const counts = useMemo(
    () => ({
      all: reports.length,
      operations: reports.filter((r) => isOperationReport(r)).length,
      battle: reports.filter((r) => r.filterType === 'battle').length,
      spy: reports.filter((r) => r.filterType === 'spy' && r.type === 'Casusluk Sondası').length,
      cyber: reports.filter((r) => r.filterType === 'cyber').length,
      kbrn: reports.filter((r) => r.filterType === 'kbrn' && !r.kbrnAlert).length,
      trade: reports.filter((r) => r.filterType === 'trade').length,
      logistics: reports.filter((r) => r.filterType === 'logistics').length,
    }),
    [reports],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return reports;
    if (filter === 'operations') return reports.filter((r) => isOperationReport(r));
    if (filter === 'spy') {
      return reports.filter((r) => r.filterType === 'spy' && r.type !== 'Ajan Operasyonu');
    }
    if (filter === 'kbrn') {
      return reports.filter((r) => r.filterType === 'kbrn' && !r.kbrnAlert);
    }
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
    const ok = window.confirm(
      t('pages.reports.confirmDeleteSelected', { count: selectedIds.size }),
    );
    if (!ok) return;
    deleteReports([...selectedIds]);
    setSelectedIds(new Set());
    setExpandedId(null);
  };

  const handleDeleteAll = () => {
    if (!reports.length) return;
    const ok = window.confirm(t('pages.reports.confirmDeleteAll', { count: reports.length }));
    if (!ok) return;
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
    <PageSessionGate loadingMessageKey="auth.syncingGame">
    <div className="page page--console">
      <LocalizedPageHeader
        pageKey="reports"
        action={reports.length > 0 ? (
          <div className="report-toolbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={filtered.length < 1}
              onClick={handleMarkFilteredRead}
            >
              {t('pages.reports.markRead')}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm report-toolbar-btn"
              disabled={selectedIds.size < 1}
              aria-disabled={selectedIds.size < 1}
              onClick={handleDeleteSelected}
            >
              {t('pages.reports.deleteSelected')} ({selectedIds.size})
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm report-toolbar-btn"
              onClick={handleDeleteAll}
            >
              {t('pages.reports.deleteAll')}
            </button>
          </div>
        ) : null}
      />

      {reports.length > 0 ? (
        <>
          <ReportFilters active={filter} onChange={setFilter} counts={counts} />
          <label className="report-select-all">
            <CyberToggle
              checked={allFilteredSelected}
              onChange={() => toggleSelectAll()}
              activeLabel={t('pages.reports.filterAll')}
              lockedLabel={t('pages.reports.filterSelect')}
              aria-label={t('pages.reports.selectAllAria')}
            />
            {t('pages.reports.selectAll')}
            {selectedIds.size > 0 && (
              <span className="report-select-count">
                {' '}
                {t('pages.reports.selectedCount', { count: selectedIds.size })}
              </span>
            )}
          </label>
          <ul className="report-list">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={`report-item${expandedId === r.id ? ' report-item--open' : ''}${r.isNew ? ' report-item--new' : ''}`}
              >
                <label className="report-select">
                  <CyberToggle
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    showX
                    activeLabel={t('pages.reports.filterSelected')}
                    lockedLabel="—"
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
                    {expandedId === r.id ? t('pages.reports.hide') : t('pages.reports.detail')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <div className="report-filter-empty-wrap">
              <MilitaryEmptyState
                variant="inline"
                tag="[ FİLTRE BOŞ ]"
                icon="🔍"
                title="Bu filtrede rapor yok"
                hint="Farklı bir kategori seçin veya yeni sefer tamamlanmasını bekleyin."
              />
            </div>
          )}
        </>
      ) : null}

      {expandedId && (
        <ReportDetailModal
          report={reports.find((r) => r.id === expandedId) ?? null}
          onClose={() => setExpandedId(null)}
        />
      )}

      {reports.length === 0 && (
        <EmptyState
          tag="[ RAPOR ARŞİVİ BOŞ ]"
          icon="📋"
          title={reportsLoading ? 'Raporlar yükleniyor…' : 'Henüz raporunuz yok'}
          description={
            reportsLoading
              ? 'Sunucudaki savaş ve operasyon raporları senkronize ediliyor.'
              : 'Sefer, keşif ve casusluk operasyonları tamamlandığında detaylı raporlar burada görünür.'
          }
          actionLabel={reportsLoading ? undefined : 'Haritaya Git'}
          actionTo={reportsLoading ? undefined : '/harita'}
        />
      )}
    </div>
    </PageSessionGate>
  );
}
