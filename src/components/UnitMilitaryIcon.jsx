/** Kara / hava / deniz birim kartları — taktik SVG silüetler (emoji yerine). */

const ICONS = {
  infantry: (
    <>
      <path d="M12 4.5 13.8 7h2.7l-2.2 1.6.8 2.7L12 10.2 9.7 11.3l.8-2.7-2.2-1.6h2.7L12 4.5Z" fill="currentColor" />
      <path d="M8 12.5h8v1.8H8V12.5Zm1.2 2.2h5.6v5.3H9.2v-5.3Z" fill="currentColor" opacity="0.9" />
      <path d="M10 18.2h4v1.3h-4v-1.3Z" fill="currentColor" />
    </>
  ),
  armor: (
    <>
      <rect x="5" y="11" width="14" height="5.5" rx="1" fill="currentColor" opacity="0.85" />
      <path d="M7 9.5h10l1.5 1.5H5.5L7 9.5Z" fill="currentColor" />
      <circle cx="8" cy="17.5" r="1.6" fill="#0a0f0a" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="17.5" r="1.6" fill="#0a0f0a" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 13h6v1.5H9V13Z" fill="#0a0f0a" opacity="0.5" />
    </>
  ),
  tank: (
    <>
      <path d="M4 14h16v3H4v-3Z" fill="currentColor" opacity="0.9" />
      <path d="M6 10.5h12l2 3.5H4l2-3.5Z" fill="currentColor" />
      <rect x="10" y="7" width="4" height="4" rx="0.5" fill="currentColor" />
      <circle cx="7" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17.5" r="1.5" fill="currentColor" />
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
    <path d="M4 14h16l-2-5H6l-2 5Zm8-8 3 4h-6l3-4Z" fill="currentColor" />
  ),
  fighter: (
    <path d="M3 13 12 6l9 7-3-1 2 4h-4l-2 4-2-4H7l2-4-3 1Z" fill="currentColor" />
  ),
  bomber: (
  <>
    <path d="M2 13h20l-3-4H5l-3 4Z" fill="currentColor" />
    <ellipse cx="12" cy="15" rx="3" ry="1.2" fill="currentColor" opacity="0.5" />
  </>
  ),
  drone: (
    <>
      <circle cx="8" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 10h4M8 10v5M16 10v5M10 15h4" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  patrol: (
    <path d="M5 14h14l-1.5-3H6.5L5 14Zm7-7v4M9 9h6" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" />
  ),
  frigate: (
    <path d="M3 15h18L18 9H6L3 15Zm6-6h6v2H9V9Z" fill="currentColor" />
  ),
  sub: (
    <>
      <ellipse cx="12" cy="13" rx="8" ry="3" fill="currentColor" opacity="0.85" />
      <path d="M6 13h12M8 10h8l1-2H7l1 2Z" fill="currentColor" />
      <rect x="11" y="8" width="2" height="3" fill="currentColor" />
    </>
  ),
};

const DEFAULT_ICON = ICONS.infantry;

export default function UnitMilitaryIcon({ unitId, className = '', title, size = 48 }) {
  const content = ICONS[unitId] ?? DEFAULT_ICON;

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
