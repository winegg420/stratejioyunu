const BRIEFING_PREFIX = 'strateji_ulusal_briefing_seen';
const GOVERNANCE_PREFIX = 'strateji_governance';

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

export function loadPlayerGovernance(playerKey) {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(safeKey(GOVERNANCE_PREFIX, playerKey));
  return raw === 'liberal' || raw === 'statist' ? raw : null;
}

export function savePlayerGovernance(playerKey, style) {
  if (typeof window === 'undefined') return;
  if (!style) {
    localStorage.removeItem(safeKey(GOVERNANCE_PREFIX, playerKey));
    return;
  }
  localStorage.setItem(safeKey(GOVERNANCE_PREFIX, playerKey), style);
}
