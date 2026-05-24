const ADMIN_UNLOCK_SESSION_KEY = 'strateji_admin_panel_unlock';

function normalizeToken(raw) {
  return String(raw ?? '').trim().toLowerCase().replace(/^@+/, '');
}

/** Admin Log paneli — test / aktif kod çifti (veya tek alanda "test aktif"). */
export function matchesAdminUnlockPair(userToken, codeToken) {
  const user = normalizeToken(userToken);
  const code = normalizeToken(codeToken);
  if (user === 'test' && code === 'aktif') return true;
  if (!user && code === 'aktif') return true;
  if (user === 'test' && !code) return false;
  const combined = `${user} ${code}`.trim();
  return combined === 'test aktif' || combined === 'test@ aktif@';
}

export function isAdminPanelUnlocked() {
  try {
    return sessionStorage.getItem(ADMIN_UNLOCK_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminPanelUnlocked(unlocked) {
  try {
    if (unlocked) {
      sessionStorage.setItem(ADMIN_UNLOCK_SESSION_KEY, '1');
    } else {
      sessionStorage.removeItem(ADMIN_UNLOCK_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}
