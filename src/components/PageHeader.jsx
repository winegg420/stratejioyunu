import TypewriterSubtitle from './TypewriterSubtitle';

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

const ALERT_TITLES = new Set(['Diplomasi', 'Seferler', 'İstihbarat']);

export default function PageHeader({ title, subtitle, action, status, typewriterSubtitle }) {
  const statusLine = status ?? PAGE_STATUS[title] ?? '[ STATUS: OPERATIONAL ]';
  const terminalLine = typewriterSubtitle ?? subtitle;
  const headerClass = [
    'page-header',
    'page-header--hud',
    ALERT_TITLES.has(title) && 'page-header--alert',
  ].filter(Boolean).join(' ');

  return (
    <div className={headerClass}>
      <div className="page-header__main">
        <div className="page-header__title-row">
          <span className="page-header__status-dot" aria-hidden="true" />
          <h1 className="page-title">{title}</h1>
        </div>
        <p className="page-header__status">{statusLine}</p>
        {terminalLine && <TypewriterSubtitle text={terminalLine} />}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  );
}
