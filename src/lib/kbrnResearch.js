import { RESEARCH_BUILDING_ID } from './buildingUtils';
import {
  ADVANCED_RESEARCH_CATEGORY,
  ADVANCED_RESEARCH_UNLOCK,
  KBRN_CATEGORY,
  KBRN_RESEARCH_CENTER_UNLOCK,
  normalizeResearchId,
  RESEARCH_ID_ALIASES,
} from '../data/researchCatalog';

export { ADVANCED_RESEARCH_CATEGORY, ADVANCED_RESEARCH_UNLOCK, KBRN_CATEGORY, KBRN_RESEARCH_CENTER_UNLOCK };

/** Oyun mantığı sabitleri — doktrin ID eşlemesi */
export const KBRN_RESEARCH_IDS = {
  weapon: 'r9',
  decontamination: 'r4',
  detection: 'r6',
};

export { RESEARCH_ID_ALIASES };

/** En pahalı ileri doktrin maliyet çarpanı */
export const KBRN_COST_LEVEL_MULT = 1.22;

/** Panzehir bu seviyede global salgından hasarsız (Stratejik Savunma Kalkanı) */
export const DECON_GLOBAL_IMMUNITY_LEVEL = 7;

export function getResearchCenterLevel(city) {
  const b = city?.buildings?.find((x) => x.id === RESEARCH_BUILDING_ID);
  return b?.level ?? 0;
}

export function isKbrnBranchUnlocked(city) {
  return getResearchCenterLevel(city) >= KBRN_RESEARCH_CENTER_UNLOCK;
}

/** @deprecated */
export function isAdvancedResearchUnlocked(city) {
  return isKbrnBranchUnlocked(city);
}

export { normalizeResearchId };

export function scaleKbrnResearchCost(baseCost, level = 0) {
  if (!baseCost || baseCost === '—') return baseCost;
  const mult = Math.pow(KBRN_COST_LEVEL_MULT, Math.max(0, level));
  return baseCost
    .split('·')
    .map((part) => {
      const match = part.trim().match(/([\d.,]+)\s+(\S+)/);
      if (!match) return part.trim();
      const n = Number(match[1].replace(/\./g, '').replace(',', '.'));
      const label = match[2];
      return `${Math.ceil(n * mult).toLocaleString('tr-TR')} ${label}`;
    })
    .join(' · ');
}

export function scaleAdvancedResearchCost(baseCost, level = 0, category = '') {
  if (category === ADVANCED_RESEARCH_CATEGORY || category === KBRN_CATEGORY) {
    return scaleKbrnResearchCost(baseCost, level);
  }
  return baseCost;
}

export function getKbrnResearchLevel(researches, researchId) {
  const norm = normalizeResearchId(researchId);
  const r = (researches ?? []).find(
    (x) => x.id === norm || x.id === researchId,
  );
  return r?.level ?? 0;
}

export function getWeaponDevelopmentLevel(researches) {
  return getKbrnResearchLevel(researches, KBRN_RESEARCH_IDS.weapon);
}

/** @deprecated */
export function getChemPressureLevel(researches) {
  return getWeaponDevelopmentLevel(researches);
}

export function getDecontaminationLevel(researches) {
  return getKbrnResearchLevel(researches, KBRN_RESEARCH_IDS.decontamination);
}

export function getKbrnDetectionLevel(researches) {
  return getKbrnResearchLevel(researches, KBRN_RESEARCH_IDS.detection);
}

export function canLaunchStealthCbrnOp(researches) {
  return getWeaponDevelopmentLevel(researches) >= 1;
}

/** @deprecated */
export function canLaunchChemPressureOp(researches) {
  return canLaunchStealthCbrnOp(researches);
}

export function getDecontaminationMitigationFactor(deconLevel) {
  const lv = Math.max(0, Math.floor(deconLevel || 0));
  return Math.max(0.05, 1 - lv * 0.095);
}

export function isImmuneToGlobalOutbreak(deconLevel) {
  return (deconLevel ?? 0) >= DECON_GLOBAL_IMMUNITY_LEVEL;
}

export function shouldListKbrnProtocolsInIntel(detectionLevel, intelDepth) {
  return detectionLevel >= 1 && intelDepth >= 2;
}

export function canTraceKbrnAttacker({ detectionLevel, spyLevel }) {
  const score = detectionLevel + Math.floor((spyLevel ?? 0) / 2);
  return score >= 4;
}

/** @deprecated KBRN şablonları kaldırıldı — researchCatalog kullanın */
export function createKbrnResearchTemplates() {
  return [];
}
