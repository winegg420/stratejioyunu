/**
 * Admin test modu açılmadan önce oyun dilimini saklar; kapatınca geri yükler.
 */
import { getCurrentPlayerName } from './playerIdentity';
import { getLastSyncUserId } from './supabaseSync';

const SNAPSHOT_PREFIX = 'strateji_admin_snapshot_';

export function getAdminSnapshotOwnerId() {
  const uid = getLastSyncUserId();
  if (uid) return `sb:${uid}`;
  return `demo:${getCurrentPlayerName().toLowerCase()}`;
}

function storageKey(ownerId) {
  return `${SNAPSHOT_PREFIX}${ownerId}`;
}

export function extractAdminRestorableSlice(state) {
  if (!state) return null;
  return {
    cities: state.cities ?? {},
    researches: state.researches ?? [],
    milAiCompleted: state.milAiCompleted ?? [],
    milAiScoutLaunched: Boolean(state.milAiScoutLaunched),
    milAiCelebration: state.milAiCelebration ?? null,
    protectionEndsAt: state.protectionEndsAt ?? null,
  };
}

export function applyAdminRestorableSlice(state, slice) {
  if (!state || !slice) return state;
  return {
    ...state,
    cities: slice.cities ?? state.cities,
    researches: slice.researches ?? state.researches,
    milAiCompleted: slice.milAiCompleted ?? state.milAiCompleted,
    milAiScoutLaunched: slice.milAiScoutLaunched ?? state.milAiScoutLaunched,
    milAiCelebration: slice.milAiCelebration ?? null,
    protectionEndsAt: slice.protectionEndsAt ?? state.protectionEndsAt,
    devTestModeActive: false,
  };
}

export function hasAdminSnapshot(ownerId = getAdminSnapshotOwnerId()) {
  try {
    return Boolean(localStorage.getItem(storageKey(ownerId)));
  } catch {
    return false;
  }
}

export function saveAdminSnapshot(state, ownerId = getAdminSnapshotOwnerId()) {
  if (!ownerId || !state) return false;
  if (hasAdminSnapshot(ownerId)) return true;
  try {
    const payload = {
      savedAt: Date.now(),
      slice: extractAdminRestorableSlice(state),
    };
    localStorage.setItem(storageKey(ownerId), JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[adminSnapshot] save failed', err);
    return false;
  }
}

export function loadAdminSnapshot(ownerId = getAdminSnapshotOwnerId()) {
  try {
    const raw = localStorage.getItem(storageKey(ownerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.slice ?? null;
  } catch {
    return null;
  }
}

export function clearAdminSnapshot(ownerId = getAdminSnapshotOwnerId()) {
  try {
    localStorage.removeItem(storageKey(ownerId));
  } catch {
    /* ignore */
  }
}
