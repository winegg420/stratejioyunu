/**
 * Jeopolitik İdeoloji — 4 blok; hiçbir işlem kilitlenmez, uzmanlık çarpanları uygulanır.
 */

export const IDEOLOGY_SOCIALIST = 'socialist';
export const IDEOLOGY_CAPITALIST = 'capitalist';
export const IDEOLOGY_TECHNOCRAT = 'technocrat';
export const IDEOLOGY_NATIONALIST = 'nationalist';

export const IDEOLOGY_IDS = [
  IDEOLOGY_SOCIALIST,
  IDEOLOGY_CAPITALIST,
  IDEOLOGY_TECHNOCRAT,
  IDEOLOGY_NATIONALIST,
];

export const IDEOLOGY_CHANGE_WINDOW_DAYS = 7;

export const IDEOLOGY_PROFILES = {
  [IDEOLOGY_SOCIALIST]: {
    id: IDEOLOGY_SOCIALIST,
    label: 'Sol Blok',
    subtitle: 'Sosyalist',
    tag: '[ SOL / SOCIALIST ]',
    emoji: '🔴',
    color: '#ef4444',
    colorGlow: 'rgba(239, 68, 68, 0.55)',
    blurb: 'Üretim ve nüfus — metal +%30, nüfus +%30, bütçe −%15.',
    metalProductionMult: 1.3,
    populationGrowthMult: 1.3,
    moneyProductionMult: 0.85,
    productionDurationMult: 1,
    researchDurationMult: 1,
    travelDurationMult: 1,
    tradeCapacityMult: 1,
    tradeRevenueMult: 1,
    cyberSuccessBonus: 0,
    militaryProductionMult: 1,
  },
  [IDEOLOGY_CAPITALIST]: {
    id: IDEOLOGY_CAPITALIST,
    label: 'Sağ Blok',
    subtitle: 'Kapitalist',
    tag: '[ SAĞ / CAPITALIST ]',
    emoji: '🔵',
    color: '#3b82f6',
    colorGlow: 'rgba(59, 130, 246, 0.55)',
    blurb: 'Finans ve ticaret — bütçe +%40, konvoy kapasitesi yüksek, eğitim +%15 yavaş.',
    metalProductionMult: 1,
    populationGrowthMult: 1,
    moneyProductionMult: 1.4,
    productionDurationMult: 1.15,
    researchDurationMult: 1,
    travelDurationMult: 1,
    tradeCapacityMult: 1.35,
    tradeRevenueMult: 1,
    cyberSuccessBonus: 0,
    militaryProductionMult: 1,
  },
  [IDEOLOGY_TECHNOCRAT]: {
    id: IDEOLOGY_TECHNOCRAT,
    label: 'Teknokrat Blok',
    subtitle: 'Teknokrat',
    tag: '[ TEKNO / TECHNOCRAT ]',
    emoji: '🟢',
    color: '#22c55e',
    colorGlow: 'rgba(34, 197, 94, 0.55)',
    blurb: 'Siber ve Ar-Ge — araştırma +%35 hız, siber/KBRN bonus, nüfus −%15.',
    metalProductionMult: 1,
    populationGrowthMult: 0.85,
    moneyProductionMult: 1,
    productionDurationMult: 1,
    researchDurationMult: 0.65,
    travelDurationMult: 1,
    tradeCapacityMult: 1,
    tradeRevenueMult: 1,
    cyberSuccessBonus: 12,
    militaryProductionMult: 1,
  },
  [IDEOLOGY_NATIONALIST]: {
    id: IDEOLOGY_NATIONALIST,
    label: 'Milliyetçi Blok',
    subtitle: 'Milliyetçi',
    tag: '[ MİLLİ / NATIONALIST ]',
    emoji: '🟡',
    color: '#eab308',
    colorGlow: 'rgba(234, 179, 8, 0.55)',
    blurb: 'Ordu ve fetih — üretim ve sefer +%30 hız, ticaret −%15.',
    metalProductionMult: 1,
    populationGrowthMult: 1,
    moneyProductionMult: 1,
    productionDurationMult: 0.7,
    researchDurationMult: 1,
    travelDurationMult: 0.7,
    tradeCapacityMult: 1,
    tradeRevenueMult: 0.85,
    cyberSuccessBonus: 0,
    militaryProductionMult: 1.3,
  },
};

/** Eski 2’li yönetim → 4 ideoloji (geriye uyumluluk). */
const GOVERNANCE_MIGRATION = {
  liberal: IDEOLOGY_CAPITALIST,
  statist: IDEOLOGY_SOCIALIST,
};

export function normalizeIdeology(value) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  if (IDEOLOGY_IDS.includes(v)) return v;
  if (GOVERNANCE_MIGRATION[v]) return GOVERNANCE_MIGRATION[v];
  return null;
}

export function isValidIdeology(id) {
  return IDEOLOGY_IDS.includes(id);
}

export function getIdeologyProfile(id) {
  const key = normalizeIdeology(id);
  if (!key) return null;
  return IDEOLOGY_PROFILES[key];
}

export function formatIdeologyLabel(id) {
  const p = getIdeologyProfile(id);
  return p ? `${p.emoji} ${p.label} · ${p.subtitle}` : 'İdeoloji seçilmedi';
}

export function getIdeologyResourceMultiplier(ideology, resourceId) {
  const p = getIdeologyProfile(ideology);
  if (!p) return 1;
  if (resourceId === 'metal') return p.metalProductionMult;
  if (resourceId === 'money') return p.moneyProductionMult;
  if (resourceId === 'food') return p.populationGrowthMult;
  return 1;
}

export function getProductionDurationMultiplier(ideology) {
  return getIdeologyProfile(ideology)?.productionDurationMult ?? 1;
}

export function getResearchDurationMultiplier(ideology) {
  return getIdeologyProfile(ideology)?.researchDurationMult ?? 1;
}

export function getTravelDurationMultiplier(ideology) {
  return getIdeologyProfile(ideology)?.travelDurationMult ?? 1;
}

export function applyIdeologyTravelSeconds(seconds, ideology) {
  const mult = getTravelDurationMultiplier(ideology);
  return Math.max(30, Math.round(seconds * mult));
}

export function getTradeCapacityMultiplier(ideology) {
  return getIdeologyProfile(ideology)?.tradeCapacityMult ?? 1;
}

export function getTradeRevenueMultiplier(ideology) {
  return getIdeologyProfile(ideology)?.tradeRevenueMult ?? 1;
}

export function getCyberSuccessBonus(ideology) {
  return getIdeologyProfile(ideology)?.cyberSuccessBonus ?? 0;
}

export function isNaturalAlly(playerIdeology, targetIdeology) {
  if (!playerIdeology || !targetIdeology) return false;
  return normalizeIdeology(playerIdeology) === normalizeIdeology(targetIdeology);
}

export function getIdeologyTerritoryStyle(ideology, { isOwn = false, isAlly = false } = {}) {
  const p = getIdeologyProfile(ideology);
  const color = p?.color ?? '#64748b';
  const glow = p?.colorGlow ?? 'rgba(100, 116, 139, 0.4)';
  return {
    fillColor: color,
    fillOpacity: isOwn ? 0.22 : isAlly ? 0.18 : 0.14,
    color,
    weight: isOwn || isAlly ? 3.2 : 2.6,
    opacity: 0.95,
    className: isAlly ? 'territory-ideology territory-ideology--ally' : 'territory-ideology',
    dashArray: isOwn ? undefined : isAlly ? '4 6' : '6 8',
    _ideologyGlow: glow,
  };
}

export function resolveCityIdeology(city, playerName, playerIdeology) {
  if (!city) return null;
  if (city.ownerIdeology) return normalizeIdeology(city.ownerIdeology);
  if (city.isOwn || city.status === 'own' || city.owner === playerName) {
    return normalizeIdeology(playerIdeology);
  }
  if (city.status === 'bot') return IDEOLOGY_NATIONALIST;
  return normalizeIdeology(city.ownerIdeology) ?? null;
}

export function defaultProtectionEndsAt(fromMs = Date.now()) {
  return new Date(fromMs + IDEOLOGY_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function canChangeIdeology(protectionEndsAt, now = Date.now()) {
  if (!protectionEndsAt) return true;
  const end = new Date(protectionEndsAt).getTime();
  if (Number.isNaN(end)) return true;
  return now < end;
}

export function formatIdeologyChangeDeadline(protectionEndsAt) {
  if (!protectionEndsAt) return '—';
  const end = new Date(protectionEndsAt);
  if (Number.isNaN(end.getTime())) return '—';
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return 'Süre doldu';
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return `${days} gün kaldı`;
}
