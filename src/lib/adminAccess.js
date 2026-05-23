/**
 * Kurucu / admin (God Mode) erişimi.
 * .env: VITE_FOUNDER_PLAYER_NAME, VITE_FOUNDER_EMAIL, VITE_ADMIN_PLAYER_NAMES
 */
import { resolveProfileIsAdmin } from './profileApi';

export const DEV_ADMIN_STORAGE_KEY = 'strateji_dev_admin';

function parseList(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

const ENV_ADMIN_NAMES = new Set([
  ...parseList(import.meta.env.VITE_FOUNDER_PLAYER_NAME),
  ...parseList(import.meta.env.VITE_ADMIN_PLAYER_NAMES),
]);

const ENV_ADMIN_EMAILS = new Set(parseList(import.meta.env.VITE_FOUNDER_EMAIL));

export function isDevAdminEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEV_ADMIN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isEnvAdminAllowlist(playerName, email) {
  const name = String(playerName ?? '').trim().toLowerCase();
  if (name && ENV_ADMIN_NAMES.has(name)) return true;
  const mail = String(email ?? '').trim().toLowerCase();
  if (mail && ENV_ADMIN_EMAILS.has(mail)) return true;
  return false;
}

/**
 * Oyun içi admin paneli — profil meta, auth rolü veya env allowlist.
 * Dev localStorage / VITE_ADMIN_UNLOCK burada kullanılmaz (herkese açılmasın).
 */
export function isGameAdmin({
  playerName = null,
  email = null,
  session = null,
  profileIsAdmin = false,
  profile = null,
} = {}) {
  if (profileIsAdmin) return true;
  const user = session?.user ?? null;
  if (profile && resolveProfileIsAdmin(profile, user)) return true;
  if (user && resolveProfileIsAdmin(null, user)) return true;
  if (isEnvAdminAllowlist(playerName, email)) return true;
  return false;
}

/** @deprecated isGameAdmin kullanın — geriye dönük uyumluluk */
export function isFounderPlayer(playerName, email = null, options = {}) {
  return isGameAdmin({
    playerName,
    email,
    session: options.session ?? null,
    profileIsAdmin: options.profileIsAdmin ?? false,
    profile: options.profile ?? null,
  });
}
