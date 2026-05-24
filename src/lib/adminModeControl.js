import { DEV_ADMIN_STORAGE_KEY } from './adminAccess';
import {
  applyAdminRestorableSlice,
  clearAdminSnapshot,
  loadAdminSnapshot,
  saveAdminSnapshot,
} from './adminModeSnapshot';
import { applyDevTestModeToState, setDevTestModeLocal } from './devTestMode';

const DEV_ADMIN_LS_KEY = DEV_ADMIN_STORAGE_KEY;

export function isDevAdminLocalEnabled() {
  try {
    return localStorage.getItem(DEV_ADMIN_LS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDevAdminLocalEnabled(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(DEV_ADMIN_LS_KEY, '1');
    } else {
      localStorage.removeItem(DEV_ADMIN_LS_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Supabase kaydı — admin boost DB'ye yazılmasın; snapshot kullanılır. */
export function resolveStateForCloudSave(state) {
  if (!state || !isDevAdminLocalEnabled()) return state;
  const slice = loadAdminSnapshot();
  if (!slice) return state;
  return applyAdminRestorableSlice(state, slice);
}

/** Admin modu açıkken mevcut state üzerine test boost uygular (sayfa yenilemesi gerekmez). */
export function enableAdminModeOnState(state, sessionUserId = null) {
  if (!state) return state;
  const ownerId = sessionUserId ? `sb:${sessionUserId}` : undefined;
  saveAdminSnapshot(state, ownerId);
  setDevAdminLocalEnabled(true);
  setDevTestModeLocal(true);
  const next = applyDevTestModeToState(state);
  return { ...next, devTestModeActive: true };
}

/** Snapshot varsa eski haline döner; yoksa yalnızca bayrakları kapatır. */
export function disableAdminModeOnState(state, sessionUserId = null) {
  if (!state) return state;
  const ownerId = sessionUserId ? `sb:${sessionUserId}` : undefined;
  const slice = loadAdminSnapshot(ownerId);
  setDevAdminLocalEnabled(false);
  setDevTestModeLocal(false);
  clearAdminSnapshot(ownerId);
  if (slice) {
    return applyAdminRestorableSlice(state, slice);
  }
  return { ...state, devTestModeActive: false };
}
