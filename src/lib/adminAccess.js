/**
 * Kurucu / admin (God Mode) erişimi.
 * .env: VITE_FOUNDER_PLAYER_NAME, VITE_FOUNDER_EMAIL, VITE_ADMIN_PLAYER_NAMES
 */
import { resolveProfileIsAdmin } from './profileApi';
import { isDevAdminLocalEnabled } from './devTestMode';
import { isAdminPanelUnlocked } from './adminUnlock';

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

/** Supabase hydrate — profil meta + auth + env allowlist birleşik bayrak */
export function resolveHydratedAdminFlags({ profile, authUser, displayName } = {}) {
  const profileIsAdmin = resolveProfileIsAdmin(profile, authUser);
  const email = authUser?.email ?? null;
  const isAdminUser = isGameAdmin({
    playerName: displayName,
    email,
    session: authUser ? { user: authUser } : null,
    profile,
    profileIsAdmin,
  });
  return { isAdminUser, authEmail: email };
}

/** /kurucu-kriz — kurucu veya Admin Log üzerinden açılmış test modu */
export function canOpenFounderCrisisPanel({
  playerName = null,
  email = null,
  session = null,
  profileIsAdmin = false,
  profile = null,
  devTestModeActive = false,
} = {}) {
  if (isGameAdmin({ playerName, email, session, profileIsAdmin, profile })) return true;
  if (!isDevAdminLocalEnabled()) return false;
  return Boolean(devTestModeActive) || isAdminPanelUnlocked();
}

/** Store müdahaleleri — kurucu veya aktif admin test modu */
export function canRunAdminOverrides(state, playerKey = null) {
  if (!state) return false;
  if (isGameAdmin({
    playerName: playerKey ?? state.profileDisplayName ?? state.profilePlayerName,
    email: state.authEmail ?? null,
    profileIsAdmin: state.isAdminUser,
  })) {
    return true;
  }
  return Boolean(state.devTestModeActive && isDevAdminLocalEnabled());
}
