/**
 * Çaylak koruması (Barış Gücü) + kademeli içerik kilidi (OGame / Travian öğrenme eğrisi).
 */
import { getHqLevel, getBuildingById, RESEARCH_BUILDING_ID, HQ_BUILDING_ID } from './buildingUtils';
import { getResearchCenterLevel, KBRN_RESEARCH_CENTER_UNLOCK } from './kbrnResearch';
import { getCurrentPlayerName } from './playerIdentity';
import { PROTECTION_DAYS } from '../data/placeholder';
import { defaultProtectionEndsAt } from './ideologySystem';

export const PEACE_FORCE_DAYS = PROTECTION_DAYS;

/** HQ ≤3: yalnızca maden/enerji üretim binaları */
export const STARTER_PHASE_MAX_HQ = 3;
export const UNLOCK_HQ_IDEOLOGY = 4;
export const UNLOCK_HQ_ADVANCED_UI = 5;
export const UNLOCK_HQ_CYBER_BUILDING = 'cyber_ops';

export const STARTER_VISIBLE_BUILDING_IDS = new Set([
  HQ_BUILDING_ID,
  'refinery',
  'factory',
  'plant',
  'depot',
]);

export const AGGRESSIVE_EXPEDITION_MODES = new Set(['attack', 'spy', 'cyber', 'kbrn']);

export function isPeaceForceProtected(protectionEndsAt, now = Date.now()) {
  if (!protectionEndsAt) return false;
  const end = new Date(protectionEndsAt).getTime();
  if (Number.isNaN(end)) return false;
  return now < end;
}

export function formatPeaceForceCountdown(protectionEndsAt, now = Date.now()) {
  if (!isPeaceForceProtected(protectionEndsAt, now)) return null;
  const end = new Date(protectionEndsAt).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days} gün ${hours} sa`;
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours} sa ${mins} dk`;
  return `${mins} dk`;
}

export function isAggressiveExpeditionMode(mode) {
  return AGGRESSIVE_EXPEDITION_MODES.has(mode);
}

export function isHumanMapTarget(mapCity, playerName = getCurrentPlayerName()) {
  if (!mapCity?.owner) return false;
  if (mapCity.status === 'bot' || mapCity.status === 'empty') return false;
  if (mapCity.isOwn || mapCity.owner === playerName) return false;
  return true;
}

/**
 * Saldırı / siber / KBRN seferi öncesi kontrol.
 * @returns {{ ok: boolean, reason?: string, revokePeaceForce?: boolean }}
 */
export function evaluatePeaceForceForExpedition(state, targetCity, mode) {
  const playerName = getCurrentPlayerName();
  const isOwn = state.playerCities?.some((pc) => pc.name === targetCity?.name);
  if (isOwn) return { ok: true };

  if (!isAggressiveExpeditionMode(mode)) return { ok: true };

  const peaceProtected = isPeaceForceProtected(state.protectionEndsAt);
  const targetIsOurCity = state.playerCities?.some((pc) => pc.name === targetCity?.name);

  if (peaceProtected && targetIsOurCity && !isOwn) {
    return {
      ok: false,
      reason: 'Saldırı İmkansız: Hedef Barış Gücü Koruması altında.',
    };
  }

  if (peaceProtected && !isOwn) {
    return {
      ok: true,
      revokePeaceForce: true,
    };
  }

  return { ok: true };
}

export function getProgressionState(city) {
  const hq = getHqLevel(city);
  const researchLv = getResearchCenterLevel(city);
  const cyber = getBuildingById(city, UNLOCK_HQ_CYBER_BUILDING);
  const cyberBuilt = (cyber?.level ?? 0) >= 1 && cyber?.built;

  return {
    hqLevel: hq,
    isStarterPhase: hq > 0 && hq <= STARTER_PHASE_MAX_HQ,
    ideologyUnlocked: hq >= UNLOCK_HQ_IDEOLOGY,
    advancedUiUnlocked: hq >= UNLOCK_HQ_ADVANCED_UI,
    cyberUnlocked: cyberBuilt,
    kbrnUnlocked: researchLv >= KBRN_RESEARCH_CENTER_UNLOCK,
    locks: {
      ideology: hq < UNLOCK_HQ_IDEOLOGY
        ? `Komuta Merkezi Sv.${UNLOCK_HQ_IDEOLOGY}'te açılır`
        : null,
      cyber: !cyberBuilt
        ? 'Siber Merkez inşa edilince açılır'
        : null,
      kbrn: researchLv < KBRN_RESEARCH_CENTER_UNLOCK
        ? `Ar-Ge Merkezi Sv.${KBRN_RESEARCH_CENTER_UNLOCK}'de açılır`
        : null,
      advanced: hq < UNLOCK_HQ_ADVANCED_UI
        ? `Komuta Merkezi Sv.${UNLOCK_HQ_ADVANCED_UI}'te tam panel`
        : null,
    },
  };
}

export function isBuildingVisibleInStarterPhase(buildingId, hqLevel) {
  if (hqLevel > STARTER_PHASE_MAX_HQ) return true;
  return STARTER_VISIBLE_BUILDING_IDS.has(buildingId);
}

export function shouldShieldCityFromCrisis(state, cityId) {
  if (!isPeaceForceProtected(state.protectionEndsAt)) return false;
  return Boolean(state.playerCities?.some((pc) => pc.id === cityId));
}

export function createInitialProtectionEndsAt() {
  return defaultProtectionEndsAt();
}
