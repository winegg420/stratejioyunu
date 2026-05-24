/**
 * Admin test modu açılmadan önce oyun dilimini saklar; kapatınca geri yükler.
 */
import { getCurrentPlayerName } from './playerIdentity';
import { getLastSyncUserId } from './supabaseSync';

const SNAPSHOT_PREFIX = 'strateji_admin_snapshot_';

/** Hydrate öncesi enableAdminMode — session.user.id ile set edilir. */
let snapshotOwnerHint = null;

export function setAdminSnapshotOwnerHint(userId) {
  snapshotOwnerHint = userId ? String(userId) : null;
}

export function clearAdminSnapshotOwnerHint() {
  snapshotOwnerHint = null;
}

export function resolveAdminSnapshotOwnerId(sessionUserId = null) {
  const hinted = sessionUserId ?? snapshotOwnerHint;
  if (hinted) return `sb:${hinted}`;
  const uid = getLastSyncUserId();
  if (uid) return `sb:${uid}`;
  return `demo:${getCurrentPlayerName().toLowerCase()}`;
}

/** @deprecated resolveAdminSnapshotOwnerId kullanın */
export function getAdminSnapshotOwnerId() {
  return resolveAdminSnapshotOwnerId();
}

function storageKey(ownerId) {
  return `${SNAPSHOT_PREFIX}${ownerId}`;
}

function demoOwnerId() {
  return `demo:${getCurrentPlayerName().toLowerCase()}`;
}

function readSliceFromKey(ownerId) {
  try {
    const raw = localStorage.getItem(storageKey(ownerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.slice ?? null;
  } catch {
    return null;
  }
}

/** demo:* anahtarından sb:* anahtarına tek seferlik taşıma */
function migrateDemoSnapshotTo(ownerId) {
  if (!ownerId?.startsWith('sb:')) return;
  const demoId = demoOwnerId();
  if (demoId === ownerId) return;
  if (readSliceFromKey(ownerId)) return;
  const demoSlice = readSliceFromKey(demoId);
  if (!demoSlice) return;
  try {
    localStorage.setItem(
      storageKey(ownerId),
      JSON.stringify({ savedAt: Date.now(), slice: demoSlice, migratedFrom: demoId }),
    );
    localStorage.removeItem(storageKey(demoId));
  } catch (err) {
    console.warn('[adminSnapshot] migrate failed', err);
  }
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

export function hasAdminSnapshot(ownerId = resolveAdminSnapshotOwnerId()) {
  try {
    return Boolean(localStorage.getItem(storageKey(ownerId)));
  } catch {
    return false;
  }
}

export function saveAdminSnapshot(state, ownerId = resolveAdminSnapshotOwnerId()) {
  if (!ownerId || !state) return false;
  migrateDemoSnapshotTo(ownerId);
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

export function loadAdminSnapshot(ownerId = resolveAdminSnapshotOwnerId()) {
  migrateDemoSnapshotTo(ownerId);
  const slice = readSliceFromKey(ownerId);
  if (slice) return slice;
  if (ownerId.startsWith('sb:')) {
    return readSliceFromKey(demoOwnerId());
  }
  return null;
}

export function clearAdminSnapshot(ownerId = resolveAdminSnapshotOwnerId()) {
  try {
    localStorage.removeItem(storageKey(ownerId));
    if (ownerId.startsWith('sb:')) {
      localStorage.removeItem(storageKey(demoOwnerId()));
    }
  } catch {
    /* ignore */
  }
}
