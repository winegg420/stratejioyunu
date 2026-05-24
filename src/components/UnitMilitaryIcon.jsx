/** Kara / hava / deniz birim kartları — taktik SVG silüetler (emoji yerine). */

const LAND_UNITS = new Set([
  'infantry', 'armor', 'tank', 'airdefense', 'sniper', 'special', 'colonist',
]);
const AIR_UNITS = new Set(['scout', 'fighter', 'bomber', 'drone']);
const SEA_UNITS = new Set(['patrol', 'frigate', 'sub']);

export function resolveUnitIconDomain(unitId, domain) {
  if (domain === 'land' || domain === 'air' || domain === 'sea') return domain;
  if (AIR_UNITS.has(unitId)) return 'air';
  if (SEA_UNITS.has(unitId)) return 'sea';
  if (LAND_UNITS.has(unitId)) return 'land';
  return 'land';
}

const ICONS = {
  infantry: (
    <>
      <circle cx="12" cy="5.5" r="2.2" fill="currentColor" />
      <path d="M9.5 8h5v2.5h-1.2l-.8 3.2h-1l-.8-3.2H9.5V8Z" fill="currentColor" />
      <path d="M8.5 11.2h7v1.5H8.5v-1.5Z" fill="currentColor" opacity="0.85" />
      <path d="M7.5 13.5h9v4.5c0 .8-.7 1.5-1.5 1.5h-6c-.8 0-1.5-.7-1.5-1.5v-4.5Z" fill="currentColor" />
      <path d="M9 18.5h1.5v2H9v-2Zm4.5 0H15v2h-1.5v-2Z" fill="currentColor" />
    </>
  ),
  armor: (
    <>
      <path d="M5 12.5h14v4.5H5v-4.5Z" fill="currentColor" opacity="0.9" />
      <path d="M7 10h10l1.8 2.5H5.2L7 10Z" fill="currentColor" />
      <rect x="9" y="13" width="6" height="2" rx="0.3" fill="#0a0f0a" opacity="0.45" />
      <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" />
    </>
  ),
  tank: (
    <>
      <path d="M3.5 14.5h17v3H3.5v-3Z" fill="currentColor" opacity="0.92" />
      <path d="M5.5 11h13l2 3.5H3.5l2-3.5Z" fill="currentColor" />
      <rect x="9.5" y="7.5" width="5" height="4" rx="0.4" fill="currentColor" />
      <path d="M14.5 9.5h5.5l1 2h-6.5v-2Z" fill="currentColor" />
      <circle cx="7" cy="17.8" r="1.4" fill="currentColor" />
      <circle cx="12" cy="17.8" r="1.4" fill="currentColor" />
      <circle cx="17" cy="17.8" r="1.4" fill="currentColor" />
    </>
  ),
  airdefense: (
    <>
      <path d="M12 4v3.5M8.5 7.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
      <path d="M12 7.5 16.5 16H7.5L12 7.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 16h14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="11" r="2" fill="currentColor" opacity="0.35" />
    </>
  ),
  sniper: (
    <>
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 6.5V4M12 19.5V17M6.5 12H4M20 12h-2.5M7.8 7.8 6 6M18 18l-1.8-1.8M16.2 7.8 18 6M7.8 16.2 6 18" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  special: (
    <>
      <path d="M12 4 14.5 9.5H19l-6 4.5 2.3 7L12 16.5 8.7 21l2.3-7-6-4.5h4.5L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.45" />
    </>
  ),
  colonist: (
    <>
      <rect x="6" y="9" width="12" height="7" rx="0.8" fill="currentColor" opacity="0.8" />
      <path d="M8 7h8v2H8V7Z" fill="currentColor" />
      <path d="M10 11h4v3h-4v-3Z" fill="#0a0f0a" opacity="0.45" />
      <circle cx="8.5" cy="17" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="17" r="1.3" fill="currentColor" />
    </>
  ),
  scout: (
    <>
      <path d="M3 12.5h14l-1.2-1.8H4.2L3 12.5Z" fill="currentColor" opacity="0.35" />
      <path d="M4.5 12h15l-1-2.2H5.5L4.5 12Z" fill="currentColor" />
      <path d="M6 9.8h12l-.8-1.6H6.8L6 9.8Z" fill="currentColor" opacity="0.75" />
      <path d="M11 7.5h2v2.3h-2V7.5Z" fill="currentColor" />
      <path d="M16.5 10.2 19 8.5v1.2l-2.5 1.1v-.6Z" fill="currentColor" />
      <circle cx="8.5" cy="12.8" r="0.9" fill="#0a0f0a" opacity="0.5" />
    </>
  ),
  fighter: (
    <>
      <path d="M2 13h20v1.2H2V13Z" fill="currentColor" opacity="0.3" />
      <path d="M4 11.8h16l-1.2-2H5.2L4 11.8Z" fill="currentColor" />
      <path d="M7.5 9.6h9l-.7-1.4H8.2l-.7 1.4Z" fill="currentColor" opacity="0.8" />
      <path d="M10.5 7.8h3v1.8h-3V7.8Z" fill="currentColor" />
      <path d="M18.5 10.5 21.5 8.8v1.5L18.5 12v-1.5Z" fill="currentColor" />
      <path d="M5.5 10.8 3 9.5v1.1l2.5 1.4v-.2Z" fill="currentColor" opacity="0.65" />
      <path d="M11.8 11.4h.4v2.2h-.4v-2.2Z" fill="currentColor" opacity="0.55" />
    </>
  ),
  bomber: (
    <>
      <path d="M1.5 13.2h21v1.3H1.5v-1.3Z" fill="currentColor" opacity="0.28" />
      <path d="M3.5 12h17l-1.5-2.4H5L3.5 12Z" fill="currentColor" />
      <path d="M6 9.8h12l-1-1.8H7L6 9.8Z" fill="currentColor" opacity="0.72" />
      <path d="M8.5 7.6h7l-.8-1.5H9.3l-.8 1.5Z" fill="currentColor" />
      <path d="M11 6.2h2v2.2h-2V6.2Z" fill="currentColor" />
      <path d="M19 10.8 22 9v1.6l-3 1.5V10.8Z" fill="currentColor" />
      <path d="M5 10.8 2.5 9.2v1.4L5 12v-1.2Z" fill="currentColor" opacity="0.6" />
    </>
  ),
  drone: (
    <>
      <rect x="8" y="10.5" width="8" height="2.2" rx="0.5" fill="currentColor" />
      <circle cx="6.5" cy="8.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="17.5" cy="8.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="6.5" cy="15.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="17.5" cy="15.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8.4 10.6h7.2M6.5 10.5V8.5M17.5 10.5V8.5M6.5 13.5v2M17.5 13.5v2" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  patrol: (
    <>
      <path d="M4 14.5h16l-2.2-3.5H6.2L4 14.5Z" fill="currentColor" />
      <path d="M10 8.5h4v3h-4v-3Z" fill="currentColor" opacity="0.55" />
      <path d="M12 6.5v2" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  frigate: (
    <>
      <path d="M3 15h18L17.5 9H6.5L3 15Zm5-5h8v2.5H8V10Z" fill="currentColor" />
      <path d="M11 7h2v2h-2V7Z" fill="currentColor" />
    </>
  ),
  sub: (
    <>
      <ellipse cx="12" cy="13.5" rx="8.5" ry="3.2" fill="currentColor" opacity="0.88" />
      <path d="M6 13.5h12M8.5 10.5h7l1.2-2H7.3l1.2 2Z" fill="currentColor" />
      <rect x="11" y="8" width="2" height="3" fill="currentColor" />
    </>
  ),
  aircraft: (
    <>
      <path d="M4 11.8h16l-1.2-2H5.2L4 11.8Z" fill="currentColor" />
      <path d="M10.5 7.8h3v1.8h-3V7.8Z" fill="currentColor" />
      <path d="M18.5 10.5 21.5 8.8v1.5L18.5 12v-1.5Z" fill="currentColor" />
    </>
  ),
  ship: (
    <>
      <path d="M3.5 15h17l-2.5-4H6L3.5 15Z" fill="currentColor" />
      <path d="M10 9.5h4v3.5h-4V9.5Z" fill="currentColor" opacity="0.5" />
      <path d="M12 7v2.5" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
};

const DOMAIN_FALLBACK = {
  land: ICONS.infantry,
  air: ICONS.aircraft,
  sea: ICONS.ship,
};

function resolveIconContent(unitId, domain) {
  if (ICONS[unitId]) return ICONS[unitId];
  const resolved = resolveUnitIconDomain(unitId, domain);
  return DOMAIN_FALLBACK[resolved] ?? ICONS.infantry;
}

export default function UnitMilitaryIcon({
  unitId,
  domain,
  className = '',
  title,
  size = 48,
}) {
  const content = resolveIconContent(unitId, domain);

  return (
    <svg
      className={['unit-military-icon', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {content}
    </svg>
  );
}
