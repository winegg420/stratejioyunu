/**
 * Kurucu (God Mode) erişimi — yalnızca tanımlı hesaplar.
 * .env: VITE_FOUNDER_PLAYER_NAME, VITE_FOUNDER_EMAIL (virgülle çoklu)
 */

function parseList(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

const FOUNDER_NAMES = new Set([
  ...parseList(import.meta.env.VITE_FOUNDER_PLAYER_NAME),
  ...parseList(import.meta.env.VITE_ADMIN_PLAYER_NAMES),
  'komutan_alpha',
]);

const FOUNDER_EMAILS = new Set(parseList(import.meta.env.VITE_FOUNDER_EMAIL));

export function isFounderPlayer(playerName, email = null) {
  if (import.meta.env.VITE_ADMIN_UNLOCK === '1') return true;
  const name = String(playerName ?? '').trim().toLowerCase();
  if (name && FOUNDER_NAMES.has(name)) return true;
  const mail = String(email ?? '').trim().toLowerCase();
  if (mail && FOUNDER_EMAILS.has(mail)) return true;
  return false;
}
