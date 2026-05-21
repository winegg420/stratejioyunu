import { supabase, isSupabaseConfigured } from './supabase';
import { LOYALTY_LEADERBOARD_DEMO } from '../data/placeholder';
import { formatIdeologyLabel } from './ideologySystem';
import { formatLoyaltyScore } from './loyaltySystem';

const DEFAULT_SERVER = 'turkiye-1';

/**
 * Tüm oyuncular — ideoloji sadakat puanına göre (OGame haydut imparator sırası mantığı).
 */
export async function fetchLoyaltyLeaderboard(serverId = DEFAULT_SERVER) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      source: 'demo',
      rows: LOYALTY_LEADERBOARD_DEMO.map((r, i) => ({
        rank: i + 1,
        playerName: r.playerName,
        displayName: r.displayName ?? r.playerName,
        ideology: r.ideology,
        ideologyLabel: formatIdeologyLabel(r.ideology),
        loyaltyScore: r.loyaltyScore,
        loyaltyLabel: formatLoyaltyScore(r.loyaltyScore),
        alliance: r.alliance ?? '—',
      })),
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('player_name, display_name, ideology, loyalty_score, alliance_name, rank_score')
    .eq('server_id', serverId)
    .order('loyalty_score', { ascending: false })
    .order('rank_score', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('[leaderboard] fetch failed', error);
    return { source: 'demo', rows: [], error: error.message };
  }

  const rows = (data ?? []).map((row, i) => ({
    rank: i + 1,
    playerName: row.player_name,
    displayName: row.display_name ?? row.player_name,
    ideology: row.ideology,
    ideologyLabel: row.ideology ? formatIdeologyLabel(row.ideology) : '—',
    loyaltyScore: row.loyalty_score ?? 0,
    loyaltyLabel: formatLoyaltyScore(row.loyalty_score),
    alliance: row.alliance_name ?? '—',
  }));

  return { source: 'live', rows };
}
