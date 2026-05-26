/** Premium elmas — inşaat hızlandırma, kuyruk slotu ve mağaza */

import {
  CONSTRUCTION_QUEUE_LIMIT,
  PRODUCTION_QUEUE_LIMIT,
} from './gameConstants';

/** Kalan sürenin %10'u kalır → %90 azalma */
export const CONSTRUCTION_SPEEDUP_REMAINING_FACTOR = 0.1;

export const DIAMOND_STARTER_BALANCE = 30;

/** Ek inşaat / üretim kuyruğu satırı başına elmas */
export const QUEUE_SLOT_DIAMOND_COST = 12;

/** Elmas ile açılabilecek ek slot üst sınırı (ücretsiz + bonus) */
export const MAX_QUEUE_SLOT_BONUS = 12;

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

export function getExtraConstructionSlots(playerMeta) {
  return Math.min(
    MAX_QUEUE_SLOT_BONUS,
    Math.max(0, Math.floor(Number(playerMeta?.extraConstructionSlots) || 0)),
  );
}

export function getExtraProductionSlots(playerMeta) {
  return Math.min(
    MAX_QUEUE_SLOT_BONUS,
    Math.max(0, Math.floor(Number(playerMeta?.extraProductionSlots) || 0)),
  );
}

export function getConstructionQueueLimit(playerMeta) {
  return CONSTRUCTION_QUEUE_LIMIT + getExtraConstructionSlots(playerMeta);
}

export function getProductionQueueLimit(playerMeta) {
  return PRODUCTION_QUEUE_LIMIT + getExtraProductionSlots(playerMeta);
}

export function canPurchaseQueueSlot(playerMeta, slotType) {
  const balance = getPlayerDiamonds(playerMeta);
  if (balance < QUEUE_SLOT_DIAMOND_COST) return false;
  const bonus = slotType === 'production'
    ? getExtraProductionSlots(playerMeta)
    : getExtraConstructionSlots(playerMeta);
  return bonus < MAX_QUEUE_SLOT_BONUS;
}

/** Mağaza paketleri — ileride ödeme entegrasyonu için şema */
export const DIAMOND_STORE_PACKAGES = [
  { id: 'pack_starter', diamonds: 50, labelKey: 'premium.packages.starter', featured: false },
  { id: 'pack_commander', diamonds: 150, labelKey: 'premium.packages.commander', featured: true },
  { id: 'pack_fleet', diamonds: 400, labelKey: 'premium.packages.fleet', featured: false },
  { id: 'pack_supreme', diamonds: 1000, labelKey: 'premium.packages.supreme', featured: false },
];
