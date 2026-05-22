/** Araştırma kartları — neon mavi/yeşil askeri blueprint SVG ikonları */

const STROKE = '#00f0ff';
const ACCENT = '#39ff14';
const DIM = 'rgba(0, 240, 255, 0.35)';

function BlueprintSvg({ children, viewBox = '0 0 64 64' }) {
  return (
    <svg
      className="research-blueprint-icon__svg"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4" width="56" height="56" fill="none" stroke={DIM} strokeWidth="0.75" strokeDasharray="3 2" />
      {children}
    </svg>
  );
}

const ICONS = {
  r1: (
    <BlueprintSvg>
      <path d="M12 48 L18 28 L28 24 L36 22 L52 20 L58 24 L54 32 L44 36 L32 38 L22 42 Z" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <rect x="20" y="30" width="22" height="10" fill="none" stroke={ACCENT} strokeWidth="1" />
      <circle cx="24" cy="44" r="4" fill="none" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="40" cy="44" r="4" fill="none" stroke={STROKE} strokeWidth="1.2" />
      <line x1="32" y1="22" x2="32" y2="16" stroke={ACCENT} strokeWidth="1" />
    </BlueprintSvg>
  ),
  r2: (
    <BlueprintSvg>
      <path d="M10 36 L42 22 L54 26 L48 34 L20 40 Z" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <path d="M44 22 L52 14 L58 18 L50 28 Z" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <line x1="18" y1="38" x2="8" y2="42" stroke={STROKE} strokeWidth="1" />
      <line x1="26" y1="35" x2="16" y2="39" stroke={DIM} strokeWidth="0.8" />
    </BlueprintSvg>
  ),
  r3: (
    <BlueprintSvg>
      <path d="M32 12 L38 20 L36 44 L28 52 L20 44 L18 20 Z" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <circle cx="32" cy="30" r="6" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <path d="M32 8 L32 14 M26 10 L38 10" stroke={STROKE} strokeWidth="1.2" />
      <path d="M14 50 L50 50" stroke={DIM} strokeWidth="0.8" strokeDasharray="2 2" />
    </BlueprintSvg>
  ),
  r4: (
    <BlueprintSvg>
      <path d="M32 14 L48 22 L48 42 L32 50 L16 42 L16 22 Z" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <path d="M32 20 L40 26 L40 38 L32 44 L24 38 L24 26 Z" fill="none" stroke={ACCENT} strokeWidth="1" />
      <line x1="32" y1="14" x2="32" y2="8" stroke={STROKE} strokeWidth="1" />
    </BlueprintSvg>
  ),
  r5: (
    <BlueprintSvg>
      <circle cx="32" cy="32" r="10" fill="none" stroke={STROKE} strokeWidth="1.2" />
      <path d="M32 10 L32 18 M32 46 L32 54 M10 32 L18 32 M46 32 L54 32" stroke={ACCENT} strokeWidth="1" />
      <path d="M16 16 Q32 28 48 16" fill="none" stroke={STROKE} strokeWidth="1" />
      <path d="M16 48 Q32 36 48 48" fill="none" stroke={STROKE} strokeWidth="1" />
    </BlueprintSvg>
  ),
  r6: (
    <BlueprintSvg>
      <circle cx="32" cy="20" r="5" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <circle cx="16" cy="44" r="4" fill="none" stroke={STROKE} strokeWidth="1" />
      <circle cx="48" cy="44" r="4" fill="none" stroke={STROKE} strokeWidth="1" />
      <line x1="32" y1="25" x2="16" y2="40" stroke={STROKE} strokeWidth="1" />
      <line x1="32" y1="25" x2="48" y2="40" stroke={STROKE} strokeWidth="1" />
      <line x1="16" y1="44" x2="48" y2="44" stroke={DIM} strokeWidth="0.8" strokeDasharray="2 2" />
    </BlueprintSvg>
  ),
  r7: (
    <BlueprintSvg>
      <rect x="14" y="18" width="36" height="28" rx="2" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <line x1="22" y1="18" x2="22" y2="46" stroke={DIM} strokeWidth="0.8" />
      <line x1="32" y1="18" x2="32" y2="46" stroke={DIM} strokeWidth="0.8" />
      <line x1="42" y1="18" x2="42" y2="46" stroke={DIM} strokeWidth="0.8" />
      <line x1="14" y1="28" x2="50" y2="28" stroke={ACCENT} strokeWidth="1" />
      <line x1="14" y1="36" x2="50" y2="36" stroke={STROKE} strokeWidth="0.8" />
      <circle cx="22" cy="28" r="2" fill={ACCENT} />
      <circle cx="42" cy="36" r="2" fill={STROKE} />
    </BlueprintSvg>
  ),
  r8: (
    <BlueprintSvg>
      <rect x="22" y="26" width="20" height="18" rx="2" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <path d="M28 32 L32 36 L40 28" fill="none" stroke={ACCENT} strokeWidth="1.4" />
      <circle cx="32" cy="20" r="6" fill="none" stroke={STROKE} strokeWidth="1" />
      <line x1="32" y1="14" x2="32" y2="8" stroke={ACCENT} strokeWidth="1" />
    </BlueprintSvg>
  ),
  r9: (
    <BlueprintSvg>
      <circle cx="32" cy="34" r="14" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <circle cx="32" cy="34" r="6" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <line x1="32" y1="12" x2="32" y2="20" stroke={STROKE} strokeWidth="1.4" />
      <line x1="24" y1="16" x2="40" y2="16" stroke={STROKE} strokeWidth="1.4" />
      <line x1="20" y1="22" x2="44" y2="22" stroke={ACCENT} strokeWidth="1" />
    </BlueprintSvg>
  ),
  r10: (
    <BlueprintSvg>
      <rect x="14" y="22" width="16" height="24" fill="none" stroke={STROKE} strokeWidth="1.2" />
      <rect x="34" y="18" width="16" height="28" fill="none" stroke={STROKE} strokeWidth="1.2" />
      <path d="M22 14 L22 22 M42 10 L42 18" stroke={ACCENT} strokeWidth="1" />
      <circle cx="22" cy="46" r="3" fill="none" stroke={ACCENT} strokeWidth="1" />
      <path d="M12 50 L52 50" stroke={DIM} strokeWidth="0.8" />
    </BlueprintSvg>
  ),
  r11: (
    <BlueprintSvg>
      <path d="M32 48 L32 28 L28 24 L36 24 Z" fill="none" stroke={STROKE} strokeWidth="1.4" />
      <path d="M32 28 L48 18 L52 22 L36 32 Z" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <path d="M32 28 L16 18 L12 22 L28 32 Z" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <line x1="32" y1="12" x2="32" y2="18" stroke={STROKE} strokeWidth="1" />
    </BlueprintSvg>
  ),
  r12: (
    <BlueprintSvg>
      <circle cx="32" cy="18" r="4" fill="none" stroke={ACCENT} strokeWidth="1.2" />
      <circle cx="16" cy="40" r="4" fill="none" stroke={STROKE} strokeWidth="1" />
      <circle cx="48" cy="40" r="4" fill="none" stroke={STROKE} strokeWidth="1" />
      <circle cx="32" cy="48" r="4" fill="none" stroke={STROKE} strokeWidth="1" />
      <line x1="32" y1="22" x2="16" y2="36" stroke={STROKE} strokeWidth="1" />
      <line x1="32" y1="22" x2="48" y2="36" stroke={STROKE} strokeWidth="1" />
      <line x1="16" y1="40" x2="32" y2="48" stroke={ACCENT} strokeWidth="1" />
      <line x1="48" y1="40" x2="32" y2="48" stroke={ACCENT} strokeWidth="1" />
    </BlueprintSvg>
  ),
};

export default function ResearchBlueprintIcon({ researchId, className = '' }) {
  const icon = ICONS[researchId] ?? ICONS.r1;
  return (
    <span className={['research-blueprint-icon', className].filter(Boolean).join(' ')}>
      {icon}
    </span>
  );
}
