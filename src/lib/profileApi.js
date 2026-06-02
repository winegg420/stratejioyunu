import { supabase, isSupabaseConfigured } from './supabase';
import { getDisplayName } from './auth';
import { getCompetitionDef } from './seasonChampionship';

const DEFAULT_SERVER = 'global-1';
const GENERIC_PLAYER_LABEL = 'Oyuncu';

function isUsablePlayerLabel(value) {
  const trimmed = String(value ?? '').trim();
  return Boolean(trimmed) && trimmed !== GENERIC_PLAYER_LABEL;
}

export function resolveProfileDisplayName(profile, fallback = GENERIC_PLAYER_LABEL) {
  const authFallback = isUsablePlayerLabel(fallback) ? fallback.trim() : null;
  if (!profile) return authFallback || fallback;
  const display = profile.display_name?.trim();
  if (isUsablePlayerLabel(display)) return display;
  const player = profile.player_name?.trim();
  if (isUsablePlayerLabel(player)) return player;
  return authFallback || (isUsablePlayerLabel(display) ? display : null) || fallback;
}

/** Profil başlığı — DB + Supabase auth birleşik. */
export function resolvePlayerDisplayName({ profile, user, profileDisplayName, playerName } = {}) {
  const authName = getDisplayName(user);
  const metaUsername = user?.user_metadata?.username?.trim();
  const candidates = [
    metaUsername,
    profileDisplayName,
    profile?.display_name,
    profile?.player_name,
    playerName,
    authName,
  ];
  for (const candidate of candidates) {
    if (isUsablePlayerLabel(candidate)) return String(candidate).trim();
  }
  if (isUsablePlayerLabel(authName)) return authName;
  const fromProfile = resolveProfileDisplayName(profile, authName);
  if (isUsablePlayerLabel(fromProfile)) return fromProfile;
  return playerName?.trim() || authName || GENERIC_PLAYER_LABEL;
}

export function resolveProfileIsAdmin(profile, user = null) {
  const meta = profile?.player_meta;
  if (meta && typeof meta === 'object') {
    if (meta.isAdmin === true || meta.role === 'admin') return true;
  }
  if (user) {
    const role = user.app_metadata?.role ?? user.user_metadata?.role;
    if (role === 'admin') return true;
  }
  return false;
}

export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('player_name, display_name, player_meta')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profileApi] fetchUserProfile', error);
    return null;
  }
  return data;
}

export async function fetchSeasonLeaderboardRows(competitionType, serverId = DEFAULT_SERVER) {
  if (!isSupabaseConfigured || !supabase) {
    return { source: 'empty', rows: [] };
  }

  const def = getCompetitionDef(competitionType);
  if (!def) return { source: 'empty', rows: [] };

  const { data, error } = await supabase
    .from('profiles')
    .select('player_name, display_name, player_meta')
    .eq('server_id', serverId)
    .limit(200);

  if (error) {
    console.warn('[profileApi] season leaderboard', error);
    return { source: 'error', rows: [] };
  }

  const rows = (data ?? [])
    .map((row) => ({
      playerName: row.player_name,
      displayName: row.display_name ?? row.player_name,
      score: Number(row.player_meta?.seasonStats?.[def.statKey] ?? 0),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));

  if (!rows.length) {
    return { source: 'empty', rows: [] };
  }

  return { source: 'live', rows };
}
