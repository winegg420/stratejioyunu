import { useModalDismiss, stopModalPropagation } from '../hooks/useModalDismiss';
import ReportDetail from './ReportDetail';
import HudBackButton from './HudBackButton';

export default function ReportDetailModal({ report, onClose }) {
  useModalDismiss(Boolean(report), onClose);

  if (!report) return null;

  return (
    <div
      className="report-detail-modal-root"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="report-detail-modal hud-panel-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-detail-modal-title"
        onClick={stopModalPropagation}
      >
        <header className="report-detail-modal__head">
          <h2 id="report-detail-modal-title" className="report-detail-modal__title">
            {report.title}
          </h2>
          <button
            type="button"
            className="hud-modal-close report-detail-modal__close"
            onClick={onClose}
            aria-label="Rapor detayını kapat"
          >
            [ X ]
          </button>
        </header>
        <div className="report-detail-modal__body">
          <ReportDetail report={report} />
        </div>
        <footer className="report-detail-modal__foot">
          <HudBackButton
            className="btn btn-secondary btn-sm report-detail-nav-btn hud-back-btn"
            onStepBack={onClose}
            label="Geri"
            ariaLabel="Rapor listesine dön"
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
