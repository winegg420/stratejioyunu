import { supabase, isSupabaseConfigured } from './supabase';
import { getDisplayName } from './auth';
import { getCompetitionDef } from './seasonChampionship';

const DEFAULT_SERVER = 'turkiye-1';

export function resolveProfileDisplayName(profile, fallback = 'Oyuncu') {
  const authFallback = fallback && fallback !== 'Oyuncu' ? fallback : null;
  if (!profile) return authFallback || fallback;
  const display = profile.display_name?.trim();
  if (display && display !== 'Oyuncu') return display;
  const player = profile.player_name?.trim();
  if (player && player !== 'Oyuncu') return player;
  return authFallback || display || fallback;
}

/** Profil başlığı — DB + Supabase auth birleşik. */
export function resolvePlayerDisplayName({ profile, user, profileDisplayName, playerName } = {}) {
  if (profileDisplayName?.trim() && profileDisplayName.trim() !== 'Oyuncu') {
    return profileDisplayName.trim();
  }
  const fromProfile = resolveProfileDisplayName(profile, getDisplayName(user));
  if (fromProfile && fromProfile !== 'Oyuncu') return fromProfile;
  if (playerName?.trim() && playerName.trim() !== 'Oyuncu') return playerName.trim();
  const fromAuth = getDisplayName(user);
  return fromAuth !== 'Oyuncu' ? fromAuth : (playerName?.trim() || 'Oyuncu');
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
