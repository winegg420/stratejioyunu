import { DEFAULT_GAME_CONFIG } from '../data/worldCitiesCatalog';

const STORAGE_KEY = 'strateji_game_config_v1';

/** İstemci önbelleği — Supabase game_config ile birleştirilir. */
export function loadGameConfig(serverId = DEFAULT_GAME_CONFIG.serverId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAME_CONFIG, serverId };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_GAME_CONFIG, serverId, ...parsed };
  } catch {
    return { ...DEFAULT_GAME_CONFIG, serverId };
  }
}

export function saveGameConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore quota */
  }
}

/** Supabase satırlarını tek config nesnesine çevirir. */
export function mergeGameConfigRows(rows = []) {
  const base = { ...DEFAULT_GAME_CONFIG };
  for (const row of rows) {
    if (!row?.config_key) continue;
    base[row.config_key] = row.config_value ?? row.value ?? row.config_value_json;
  }
  return base;
}
