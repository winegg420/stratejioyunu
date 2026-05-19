const PAGE_STATUS = {
  'Ana Merkez': '[ STATUS: OPERATIONAL ]',
  Binalar: '[ STATUS: CONSTRUCTION ]',
  Kışla: '[ STATUS: COMBAT READY ]',
  'Hava Üssü': '[ STATUS: AIRSPACE ]',
  Tersane: '[ STATUS: NAVAL OPS ]',
  Seferler: '[ STATUS: COLD WAR ZONE ]',
  Harita: '[ STATUS: TACTICAL GRID ]',
  Raporlar: '[ STATUS: INTEL FEED ]',
};

export default function PageHeader({ title, subtitle, action, status }) {
  const statusLine = status ?? PAGE_STATUS[title] ?? '[ STATUS: OPERATIONAL ]';

  return (
    <div className="page-header page-header--hud">
      <div className="page-header__main">
        <div className="page-header__title-row">
          <span className="page-header__status-dot" aria-hidden="true" />
          <h1 className="page-title">{title}</h1>
        </div>
        <p className="page-header__status font-hud-data">{statusLine}</p>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  );
}

