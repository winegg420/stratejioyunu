import { RESEARCH_BUILDING_ID } from './buildingUtils';

export const KBRN_CATEGORY = 'kbrn';

/** KBRN dalı — Ar-Ge Merkezi bu seviyeye ulaşınca açılır */
export const KBRN_RESEARCH_CENTER_UNLOCK = 8;

export const KBRN_RESEARCH_IDS = {
  weapon: 'kbrn_weapon',
  decontamination: 'kbrn_decon',
  detection: 'kbrn_detect',
  /** @deprecated DB uyumu */
  chemPressure: 'kbrn_chem',
};

const RESEARCH_ID_ALIASES = {
  kbrn_chem: 'kbrn_weapon',
};

/** En pahalı araştırma dalı */
export const KBRN_COST_LEVEL_MULT = 1.22;

/** Panzehir bu seviyede global salgından hasarsız */
export const DECON_GLOBAL_IMMUNITY_LEVEL = 7;

export function getResearchCenterLevel(city) {
  const b = city?.buildings?.find((x) => x.id === RESEARCH_BUILDING_ID);
  return b?.level ?? 0;
}

export function isKbrnBranchUnlocked(city) {
  return getResearchCenterLevel(city) >= KBRN_RESEARCH_CENTER_UNLOCK;
}

export function normalizeResearchId(researchId) {
  return RESEARCH_ID_ALIASES[researchId] ?? researchId;
}

export function createKbrnResearchTemplates() {
  return [
    {
      id: KBRN_RESEARCH_IDS.weapon,
      category: KBRN_CATEGORY,
      name: 'KBRN Silahı Geliştirme',
      level: 0,
      max: 10,
      desc: 'Kimyasal/biyolojik ajanlar — haritadan sinsi operasyon. Başarıda 1 saat nüfus/moral/üretim felci. Haber akışında kaynak gizli kalır.',
      active: false,
      queued: false,
      time: '12:00:00',
      cost: '28.000 metal · 15.000 para · 8.000 enerji',
    },
    {
      id: KBRN_RESEARCH_IDS.decontamination,
      category: KBRN_CATEGORY,
      name: 'Dekontaminasyon Protokolü (Panzehir)',
      level: 0,
      max: 10,
      desc: 'Düşman sinsi saldırıları ve AI bölgesel salgınlarına karşı koruma. Yüksek seviye = hasar ve süre sıfıra yakın.',
      active: false,
      queued: false,
      time: '14:00:00',
      cost: '32.000 metal · 18.000 para · 10.000 enerji',
    },
    {
      id: KBRN_RESEARCH_IDS.detection,
      category: KBRN_CATEGORY,
      name: 'Erken Uyarı & Tespit Teknolojisi',
      level: 0,
      max: 10,
      desc: 'Casus raporlarında düşman KBRN protokolleri. Çok yüksek istihbarat ile sinsi saldırgan kimliği.',
      active: false,
      queued: false,
      time: '10:00:00',
      cost: '24.000 metal · 12.000 para · 6.000 enerji',
    },
  ];
}

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

export function getKbrnResearchLevel(researches, researchId) {
  const norm = normalizeResearchId(researchId);
  const r = (researches ?? []).find(
    (x) => x.id === norm || x.id === researchId,
  );
  if (r) return r.level ?? 0;
  if (researchId === KBRN_RESEARCH_IDS.weapon) {
    const legacy = (researches ?? []).find((x) => x.id === 'kbrn_chem');
    return legacy?.level ?? 0;
  }
  return 0;
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
