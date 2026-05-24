/**
 * season_chronicles — küresel sezon arşivi (Supabase).
 */
import { supabase, isSupabaseConfigured } from './supabase';
import {
  CHRONICLE_TYPES,
  SERVER_SLUG,
  createChronicleEntry,
  getChroniclesForSeason,
  getCurrentSeasonId,
  syncSeasonChronicles,
  createDemoChronicleArchive,
} from './historyBook';

const DEFAULT_SERVER = SERVER_SLUG;

function rowToEntry(row) {
  return createChronicleEntry({
    type: row.chronicle_type,
    text: row.body ?? row.headline,
    at: new Date(row.occurred_at).getTime(),
    seasonId: row.season_id,
    payload: row.meta ?? {},
  });
}

/**
 * Yeni kronik satırını küresel tabloya yazar.
 */
export async function persistChronicleToServer(entry) {
  if (!isSupabaseConfigured || !supabase || !entry?.text) {
    return { ok: false, reason: 'offline' };
  }
  const { error } = await supabase.from('season_chronicles').insert({
    server_id: DEFAULT_SERVER,
    season_id: entry.seasonId ?? getCurrentSeasonId(entry.at),
    chronicle_type: entry.type,
    occurred_at: new Date(entry.at).toISOString(),
    headline: entry.text.slice(0, 240),
    body: entry.text,
    actors: {
      ...(entry.payload ?? {}),
    },
    meta: entry.payload ?? {},
  });
  if (error) {
    console.warn('[historyBook] persist failed', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Sezon arşivini sunucudan çeker; yerel state ile birleştirir.
 */
export async function fetchSeasonChroniclesFromServer(seasonId, localState) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      source: 'local',
      state: syncSeasonChronicles(localState),
    };
  }

  const { data, error } = await supabase
    .from('season_chronicles')
    .select('id, season_id, chronicle_type, occurred_at, headline, body, meta')
    .eq('server_id', DEFAULT_SERVER)
    .eq('season_id', seasonId)
    .order('occurred_at', { ascending: true })
    .limit(200);

  if (error) {
    console.warn('[historyBook] fetch failed', error);
    return {
      source: 'local',
      state: syncSeasonChronicles(localState),
      error: error.message,
    };
  }

  const remoteEntries = (data ?? []).map(rowToEntry);
  const merged = mergeRemoteChronicles(localState, seasonId, remoteEntries);
  return { source: 'live', state: merged, entries: remoteEntries };
}

function mergeRemoteChronicles(localState, seasonId, remoteEntries) {
  const base = syncSeasonChronicles(localState);
  const localForSeason = getChroniclesForSeason(base, seasonId);
  const byText = new Set(localForSeason.map((e) => e.text));
  const merged = [...localForSeason];
  for (const r of remoteEntries) {
    if (!byText.has(r.text)) merged.push(r);
  }
  merged.sort((a, b) => a.at - b.at);

  if (seasonId === base.currentSeasonId) {
    return { ...base, entries: merged.slice(-120) };
  }
  return {
    ...base,
    archives: {
      ...base.archives,
      [seasonId]: merged,
    },
  };
}

/**
 * Tüm bilinen sezon kimliklerini listeler.
 */
export async function fetchAvailableSeasonIds(localState) {
  const localIds = new Set([
    ...(localState?.archives ? Object.keys(localState.archives) : []),
    localState?.currentSeasonId,
  ].filter(Boolean));

  if (!isSupabaseConfigured || !supabase) {
    return [...localIds].filter(Boolean).sort().reverse();
  }

  const { data, error } = await supabase
    .from('season_chronicles')
    .select('season_id')
    .eq('server_id', DEFAULT_SERVER);

  if (!error && data) {
    for (const row of data) {
      if (row.season_id) localIds.add(row.season_id);
    }
  }
  return [...localIds].sort().reverse();
}

export { CHRONICLE_TYPES, createDemoChronicleArchive };
