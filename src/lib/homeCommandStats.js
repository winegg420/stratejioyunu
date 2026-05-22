import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Ana Merkez komuta widget'ları — Supabase'ten anlık sayılar.
 */
export async function fetchHomeCommandStatsFromServer(profileId) {
  if (!isSupabaseConfigured || !supabase || !profileId) return null;

  try {
    const [expRes, reportRes, cityRes] = await Promise.all([
      supabase
        .from('expeditions')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('status', 'active'),
      supabase
        .from('game_reports')
        .select('id, is_read')
        .eq('profile_id', profileId),
      supabase
        .from('cities')
        .select('construction_queue, production_queue')
        .eq('profile_id', profileId),
    ]);

    if (expRes.error) console.warn('[homeCommandStats] expeditions', expRes.error);
    if (reportRes.error) console.warn('[homeCommandStats] reports', reportRes.error);
    if (cityRes.error) console.warn('[homeCommandStats] cities', cityRes.error);

    let constructionCount = 0;
    let productionCount = 0;
    for (const row of cityRes.data ?? []) {
      constructionCount += (row.construction_queue ?? []).length;
      productionCount += (row.production_queue ?? []).length;
    }

    const unreadReports = (reportRes.data ?? []).filter((r) => !r.is_read).length;

    return {
      activeExpeditions: expRes.count ?? 0,
      constructionCount,
      productionCount,
      unreadReports,
    };
  } catch (err) {
    console.warn('[homeCommandStats] fetch failed', err);
    return null;
  }
}
