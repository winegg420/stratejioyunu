import { getCurrentPlayerName } from './playerIdentity';
import { mergeReportLists } from './supabaseSync';

const CACHE_PREFIX = 'strateji_reports_cache_';
const MAX_CACHED = 80;

export function loadCachedReports(playerName = getCurrentPlayerName()) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${playerName}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCachedReports(reports, playerName = getCurrentPlayerName()) {
  if (typeof window === 'undefined' || !Array.isArray(reports)) return;
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${playerName}`,
      JSON.stringify(reports.slice(0, MAX_CACHED)),
    );
  } catch {
    /* ignore quota */
  }
}

export function mergeReportsWithCache(local = [], playerName = getCurrentPlayerName()) {
  const cached = loadCachedReports(playerName);
  return mergeReportLists(mergeReportLists(cached, local), []);
}
