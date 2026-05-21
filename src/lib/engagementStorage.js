/**
 * Sezon, günlük görev ve istihbarat takip — localStorage kalıcılığı.
 */
const DAILY_QUESTS_PREFIX = 'strateji_daily_quests';
const WATCHLIST_PREFIX = 'strateji_watchlist';
const SEASON_PREFIX = 'strateji_season_engagement';
const SEASON_STATS_PREFIX = 'strateji_season_stats';
const COSMETIC_TITLES_PREFIX = 'strateji_cosmetic_titles';

function safeKey(prefix, playerKey) {
  const id = (playerKey || 'default').trim().replace(/\s+/g, '_').slice(0, 64);
  return `${prefix}_${id}`;
}

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  if (value == null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadDailyQuestsState(playerKey) {
  return readJson(safeKey(DAILY_QUESTS_PREFIX, playerKey), null);
}

export function saveDailyQuestsState(playerKey, state) {
  writeJson(safeKey(DAILY_QUESTS_PREFIX, playerKey), state);
}

export function loadWatchlist(playerKey) {
  const raw = readJson(safeKey(WATCHLIST_PREFIX, playerKey), []);
  return Array.isArray(raw) ? raw : [];
}

export function saveWatchlist(playerKey, list) {
  writeJson(safeKey(WATCHLIST_PREFIX, playerKey), list);
}

export function loadSeasonEngagement(playerKey) {
  return readJson(safeKey(SEASON_PREFIX, playerKey), null);
}

export function saveSeasonEngagement(playerKey, state) {
  writeJson(safeKey(SEASON_PREFIX, playerKey), state);
}

export function loadSeasonStats(playerKey) {
  return readJson(safeKey(SEASON_STATS_PREFIX, playerKey), null);
}

export function saveSeasonStats(playerKey, stats) {
  writeJson(safeKey(SEASON_STATS_PREFIX, playerKey), stats);
}

export function loadCosmeticTitles(playerKey) {
  const raw = readJson(safeKey(COSMETIC_TITLES_PREFIX, playerKey), []);
  return Array.isArray(raw) ? raw : [];
}

export function saveCosmeticTitles(playerKey, titles) {
  writeJson(safeKey(COSMETIC_TITLES_PREFIX, playerKey), titles);
}
