const PLAYER_KEY = 'strateji_player_name';
const GENERIC = 'Oyuncu';

/** Demo / placeholder — gerçek Supabase profili değil */
const LEGACY_DEMO_NAMES = new Set([
  'komutan_alpha',
  'komutan_beta',
  'komutan_gamma',
  'oyuncu',
  'player',
  'demo',
]);

const DEMO_NAME_PATTERN = /^komutan_(alpha|beta|gamma|demo)$/i;

export function isDemoOrPlaceholderPlayerName(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  if (lower === GENERIC.toLowerCase()) return true;
  if (LEGACY_DEMO_NAMES.has(lower)) return true;
  if (DEMO_NAME_PATTERN.test(trimmed)) return true;
  return false;
}

function readStoredName() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PLAYER_KEY)?.trim();
  if (stored && !isDemoOrPlaceholderPlayerName(stored)) return stored;
  return null;
}

export function getCurrentPlayerName() {
  if (typeof window === 'undefined') return GENERIC;
  return readStoredName() || GENERIC;
}
