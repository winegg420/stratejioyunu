import { supabase, isSupabaseConfigured } from './supabase';
import { formatIdeologyLabel } from './ideologySystem';
import { formatLoyaltyScore } from './loyaltySystem';

const DEFAULT_SERVER = 'turkiye-1';

function mapProfileRows(data = []) {
  return data.map((row, i) => ({
    rank: i + 1,
    playerName: row.player_name,
    displayName: row.display_name ?? row.player_name,
    ideology: row.ideology,
    ideologyLabel: row.ideology ? formatIdeologyLabel(row.ideology) : '—',
    loyaltyScore: row.loyalty_score ?? 0,
    loyaltyLabel: formatLoyaltyScore(row.loyalty_score ?? row.rank_score ?? 0),
    alliance: row.alliance_name ?? '—',
  }));
}

/**
 * Tüm oyuncular — ideoloji sadakat puanına göre (OGame haydut imparator sırası mantığı).
 * Demo/örnek satır döndürülmez; yalnızca Supabase profilleri.
 */
export async function fetchLoyaltyLeaderboard(serverId = DEFAULT_SERVER) {
  if (!isSupabaseConfigured || !supabase) {
    return { source: 'empty', rows: [] };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('player_name, display_name, ideology, loyalty_score, alliance_name, rank_score')
    .eq('server_id', serverId)
    .order('loyalty_score', { ascending: false })
    .order('rank_score', { ascending: false })
    .order('player_name', { ascending: true })
    .limit(100);

  if (error) {
    console.warn('[leaderboard] fetch failed', error);
    return { source: 'error', rows: [], error: error.message };
  }

  const rows = mapProfileRows(data ?? []);
  if (!rows.length) {
    return { source: 'empty', rows: [] };
  }

  return { source: 'live', rows };
}
