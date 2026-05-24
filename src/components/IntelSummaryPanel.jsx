import { getLatestOperationReport } from '../data/intelOperationsCatalog';

function formatLastOpResult(report) {
  if (!report) return 'Henüz operasyon tamamlanmadı';
  const ok = report.operationSuccess ?? report.intelSuccess ?? report.cyberSuccess ?? report.kbrnSuccess;
  const captured = report.agentCaptured || (report.agentsLost > 0);
  if (ok) return `Başarılı — ${report.title ?? report.preview}`;
  if (captured) return `Başarısız — ajan yakalandı (${report.targetCity ?? 'hedef'})`;
  return `Başarısız — ${report.title ?? report.preview}`;
}

export default function IntelSummaryPanel({
  totalAgents,
  activeOpsCount,
  counterIntelPct,
  reports = [],
  enemySpyWarning,
}) {
  const lastOp = getLatestOperationReport(reports);

  return (
    <section className="intel-summary-panel glass-panel" aria-label="İstihbarat özet paneli">
      <header className="intel-summary-panel__head">
        <span className="intel-summary-panel__tag">[ İSTİHBARAT ÖZET PANELİ ]</span>
      </header>
      <div className="intel-summary-panel__grid">
        <div className="intel-summary-panel__stat">
          <span className="intel-summary-panel__label">Toplam Ajan</span>
          <strong className="intel-summary-panel__value">{totalAgents}</strong>
          <span className="intel-summary-panel__sub">boşta hazır</span>
        </div>
        <div className="intel-summary-panel__stat">
          <span className="intel-summary-panel__label">Aktif Operasyon</span>
          <strong className={`intel-summary-panel__value${activeOpsCount > 0 ? ' intel-summary-panel__value--live' : ''}`}>
            {activeOpsCount}
          </strong>
          <span className="intel-summary-panel__sub">devam eden görev</span>
        </div>
        <div className="intel-summary-panel__stat">
          <span className="intel-summary-panel__label">Karşı İstihbarat</span>
          <strong className="intel-summary-panel__value">%{counterIntelPct}</strong>
          <span className="intel-summary-panel__sub">koruma seviyesi</span>
        </div>
        <div className="intel-summary-panel__stat intel-summary-panel__stat--wide">
          <span className="intel-summary-panel__label">Son Operasyon Sonucu</span>
          <p className="intel-summary-panel__result">{formatLastOpResult(lastOp)}</p>
        </div>
        <div className={`intel-summary-panel__stat intel-summary-panel__stat--alert${enemySpyWarning ? ' intel-summary-panel__stat--warn' : ''}`}>
          <span className="intel-summary-panel__label">Düşman Casusluk Uyarısı</span>
          <p className="intel-summary-panel__result">
            {enemySpyWarning ?? 'Aktif düşman sızma tespit edilmedi'}
          </p>
        </div>
      </div>
    </section>
  );
}
