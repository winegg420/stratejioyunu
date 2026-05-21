import { normalizeIdeology } from './ideologySystem';

const BRIEFING_PREFIX = 'strateji_ulusal_briefing_seen';
const IDEOLOGY_PREFIX = 'strateji_player_ideology';
const PROTECTION_PREFIX = 'strateji_protection_ends';
const LEGACY_GOVERNANCE_PREFIX = 'strateji_governance';

function safeKey(prefix, playerKey) {
  const id = (playerKey || 'default').trim().replace(/\s+/g, '_').slice(0, 64);
  return `${prefix}_${id}`;
}

export function hasSeenGlobalBriefing(playerKey) {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(safeKey(BRIEFING_PREFIX, playerKey)) === '1';
}

export function markGlobalBriefingSeen(playerKey) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(safeKey(BRIEFING_PREFIX, playerKey), '1');
}

export function loadPlayerIdeology(playerKey) {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(safeKey(IDEOLOGY_PREFIX, playerKey))
    ?? localStorage.getItem(safeKey(LEGACY_GOVERNANCE_PREFIX, playerKey));
  return normalizeIdeology(raw);
}

export function savePlayerIdeology(playerKey, ideology) {
  if (typeof window === 'undefined') return;
  if (!ideology) {
    localStorage.removeItem(safeKey(IDEOLOGY_PREFIX, playerKey));
    return;
  }
  localStorage.setItem(safeKey(IDEOLOGY_PREFIX, playerKey), ideology);
}

export function loadProtectionEndsAt(playerKey) {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(safeKey(PROTECTION_PREFIX, playerKey));
}

export function saveProtectionEndsAt(playerKey, iso) {
  if (typeof window === 'undefined') return;
  if (!iso) {
    localStorage.removeItem(safeKey(PROTECTION_PREFIX, playerKey));
    return;
  }
  localStorage.setItem(safeKey(PROTECTION_PREFIX, playerKey), iso);
}

/** @deprecated loadPlayerIdeology kullanın */
export function loadPlayerGovernance(playerKey) {
  return loadPlayerIdeology(playerKey);
}

/** @deprecated savePlayerIdeology kullanın */
export function savePlayerGovernance(playerKey, style) {
  savePlayerIdeology(playerKey, style);
}
