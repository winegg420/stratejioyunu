/** Premium elmas — inşaat hızlandırma ve mağaza */

/** Kalan sürenin %10'u kalır → %90 azalma */
export const CONSTRUCTION_SPEEDUP_REMAINING_FACTOR = 0.1;

export const DIAMOND_STARTER_BALANCE = 30;

/** En az 1 elmas; yaklaşık her 2 dakika kalan süre için +1 */
export function calcConstructionSpeedupDiamondCost(remainingSeconds) {
  const sec = Math.max(0, Math.floor(remainingSeconds));
  if (sec <= 0) return 0;
  return Math.max(1, Math.ceil(sec / 120));
}

export function applyConstructionTimeReduction(endsAt, now = Date.now()) {
  const remaining = Math.max(0, endsAt - now);
  if (remaining <= 0) return now;
  return now + Math.max(1000, Math.ceil(remaining * CONSTRUCTION_SPEEDUP_REMAINING_FACTOR));
}

export function getPlayerDiamonds(playerMeta) {
  const n = Number(playerMeta?.diamonds ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
