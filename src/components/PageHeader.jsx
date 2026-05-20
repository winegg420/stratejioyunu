const PAGE_STATUS = {
  'Ana Merkez': '[ KOMUTA MERKEZİ AKTİF ]',
  Binalar: '[ STATUS: CONSTRUCTION ]',
  Araştırma: '[ STATUS: RESEARCH ]',
  Kışla: '[ STATUS: COMBAT READY ]',
  'Hava Üssü': '[ STATUS: AIRSPACE ]',
  Tersane: '[ STATUS: NAVAL OPS ]',
  Seferler: '[ STATUS: COLD WAR ZONE ]',
  İstihbarat: '[ STATUS: INTEL OPS ]',
  Ticaret: '[ STATUS: LOGISTICS ]',
  Diplomasi: '[ STATUS: DIPLOMACY ]',
  Harita: '[ STATUS: TACTICAL GRID ]',
  Raporlar: '[ STATUS: INTEL FEED ]',
  Profil: '[ STATUS: PERSONNEL ]',
  Mesajlar: '[ STATUS: STATE-MAIL ]',
  'State Mail': '[ STATUS: STATE-MAIL · ENCRYPTED ]',
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
        <p className="page-header__status">{statusLine}</p>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  );
}

