/**
 * Devlet Tarih Kitabı — localStorage önbelleği.
 */
import { createDefaultChronicleState } from './historyBook';

const CHRONICLES_PREFIX = 'strateji_season_chronicles';
const TREATIES_PREFIX = 'strateji_diplomatic_treaties';
const BREAKS_PREFIX = 'strateji_treaty_breaks';

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

export function loadSeasonChronicles(playerKey) {
  return readJson(safeKey(CHRONICLES_PREFIX, playerKey), null);
}

export function saveSeasonChronicles(playerKey, state) {
  writeJson(safeKey(CHRONICLES_PREFIX, playerKey), state ?? createDefaultChronicleState());
}

export function loadDiplomaticTreaties(playerKey) {
  const raw = readJson(safeKey(TREATIES_PREFIX, playerKey), []);
  return Array.isArray(raw) ? raw : [];
}

export function saveDiplomaticTreaties(playerKey, treaties) {
  writeJson(safeKey(TREATIES_PREFIX, playerKey), treaties);
}

export function loadTreatyBreaks(playerKey) {
  const raw = readJson(safeKey(BREAKS_PREFIX, playerKey), []);
  return Array.isArray(raw) ? raw : [];
}

export function saveTreatyBreaks(playerKey, breaks) {
  writeJson(safeKey(BREAKS_PREFIX, playerKey), breaks);
}
