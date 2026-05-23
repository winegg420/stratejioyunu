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

/** Admin modu açıkken mevcut state üzerine test boost uygular (yenileme gerekmez). */
export function enableAdminModeOnState(state) {
  if (!state) return state;
  saveAdminSnapshot(state);
  setDevAdminLocalEnabled(true);
  setDevTestModeLocal(true);
  const next = applyDevTestModeToState(state);
  return { ...next, devTestModeActive: true };
}

/** Snapshot varsa eski haline döner; yoksa yalnızca bayrakları kapatır. */
export function disableAdminModeOnState(state) {
  if (!state) return state;
  const slice = loadAdminSnapshot();
  setDevAdminLocalEnabled(false);
  setDevTestModeLocal(false);
  clearAdminSnapshot();
  if (slice) {
    return applyAdminRestorableSlice(state, slice);
  }
  return { ...state, devTestModeActive: false };
}
