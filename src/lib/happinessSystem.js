import { translate } from '../i18n';
import { asArray } from './asArray';
import { clampHappiness, DEFAULT_HAPPINESS, DEFAULT_TAX_RATE } from './cityModel';
import { formatRate } from './gameUtils';
import { BUILDING_RESOURCE_MAP } from './gameUtils';
import {
  getCrisisHappinessPenalty,
  getEconomicCrisisTaxPenaltyMult,
  pruneCrisisEffects,
} from './crisisEngine';

const PRODUCTION_RESOURCE_IDS = new Set(
  Object.values(BUILDING_RESOURCE_MAP ?? {}).filter(Boolean),
);

function parseHourlyRate(rateStr) {
  const match = rateStr?.match(/\+(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** Mutluluk %100 → tam verim, %0 → üretim yok (doğrusal). */
export function getHappinessProductionMultiplier(happiness) {
  return clampHappiness(happiness) / 100;
}

/** Kışla üretim süresi çarpanı — düşük mutluluk yavaşlatır. */
export function getHappinessProductionSpeedMultiplier(happiness) {
  return getHappinessProductionMultiplier(happiness);
}

/** Vergi oranı (%) — 15 üzeri mutluluğu düşürür. */
export function getTaxHappinessPenalty(taxRate = DEFAULT_TAX_RATE, { taxPenaltyMult = 1 } = {}) {
  const rate = Number(taxRate) || DEFAULT_TAX_RATE;
  if (rate <= 15) return 0;
  const base = Math.min(35, (rate - 15) * 1.1);
  return Math.min(50, base * Math.max(1, taxPenaltyMult));
}

/** Aktif kuşatma / düşman seferi baskısı */
export function getSiegeHappinessPenalty(cityId, { incomingAttacks = [], expeditions = [] } = {}) {
  let penalty = 0;
  for (const atk of incomingAttacks) {
    if (atk.targetCityId === cityId) penalty += 18;
  }
  for (const exp of expeditions) {
    if (exp.direction !== 'outgoing') continue;
    if (exp.mode === 'attack' && exp.originCityId === cityId) continue;
    if (exp.targetCityId === cityId || exp.target === cityId) penalty += 8;
  }
  return Math.min(40, penalty);
}

/** Aktif dezenformasyon — mutluluk çarpanı (0.7 = %30 düşüş) */
export function getCyberHappinessMultiplier(cyberEffects = []) {
  const now = Date.now();
  let mult = 1;
  for (const fx of cyberEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    if (fx.happinessDebuffPercent > 0) {
      mult = Math.min(mult, 1 - Math.min(0.75, fx.happinessDebuffPercent));
    }
  }
  return mult;
}

/** Şehirdeki siber saldırı debuff'ları (düz puan cezası) */
export function getCyberHappinessPenalty(cyberEffects = []) {
  const now = Date.now();
  return (cyberEffects ?? []).reduce((sum, fx) => {
    if (fx.endsAt != null && fx.endsAt <= now) return sum;
    return sum + (fx.happinessDamage ?? 0);
  }, 0);
}

export function getActiveCyberProductionDebuff(cyberEffects = []) {
  const now = Date.now();
  let debuff = 0;
  for (const fx of cyberEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    debuff = Math.max(debuff, fx.productionDebuff ?? 0);
  }
  return Math.min(0.75, debuff);
}

export function getActiveCyberBarracksSlow(cyberEffects = []) {
  const now = Date.now();
  let slow = 0;
  for (const fx of cyberEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    slow = Math.max(slow, fx.barracksSlow ?? 0);
  }
  return Math.min(0.6, slow);
}

export function hasActiveCyberEnergyHalt(cyberEffects = []) {
  const now = Date.now();
  return (cyberEffects ?? []).some(
    (fx) => (fx.endsAt == null || fx.endsAt > now) && fx.energyHalt,
  );
}

export function getActiveCyberCommsDelayPct(cyberEffects = []) {
  const now = Date.now();
  let delay = 0;
  for (const fx of cyberEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    delay = Math.max(delay, fx.notificationDelayPct ?? 0);
  }
  return Math.min(0.35, delay);
}

export function pruneCyberEffects(cyberEffects = []) {
  const now = Date.now();
  return (cyberEffects ?? []).filter((fx) => fx.endsAt == null || fx.endsAt > now);
}

export function pruneKbrnEffects(kbrnEffects = []) {
  const now = Date.now();
  return (kbrnEffects ?? []).filter((fx) => fx.endsAt == null || fx.endsAt > now);
}

export function getKbrnHappinessMultiplier(kbrnEffects = []) {
  const now = Date.now();
  let mult = 1;
  for (const fx of kbrnEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    if (fx.happinessDebuffPercent > 0) {
      mult = Math.min(mult, 1 - Math.min(0.8, fx.happinessDebuffPercent));
    }
  }
  return mult;
}

export function getActiveKbrnProductionDebuff(kbrnEffects = []) {
  const now = Date.now();
  let debuff = 0;
  for (const fx of kbrnEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    debuff = Math.max(debuff, fx.productionDebuff ?? 0);
  }
  return Math.min(0.8, debuff);
}

export function getActiveKbrnBarracksBlock(kbrnEffects = []) {
  const now = Date.now();
  let block = 0;
  for (const fx of kbrnEffects ?? []) {
    if (fx.endsAt != null && fx.endsAt <= now) continue;
    block = Math.max(block, fx.barracksBlock ?? 0);
  }
  return Math.min(0.85, block);
}

export function getKbrnPopulationDrain(kbrnEffects = []) {
  const now = Date.now();
  return (kbrnEffects ?? []).reduce((sum, fx) => {
    if (fx.endsAt != null && fx.endsAt <= now) return sum;
    return sum + (fx.populationDrain ?? 0);
  }, 0);
}

/**
 * Şehir mutluluğunu hesapla (taban + vergi + kuşatma + siber + KBRN).
 */
export function computeCityHappiness(city, context = {}) {
  const base = city?.baseHappiness ?? DEFAULT_HAPPINESS;
  const taxRate = city?.taxRate ?? DEFAULT_TAX_RATE;
  const effects = pruneCyberEffects(city?.cyberEffects);
  const kbrn = pruneKbrnEffects(city?.kbrnEffects);
  const crisisFx = pruneCrisisEffects(city?.crisisEffects);
  const taxMult = getEconomicCrisisTaxPenaltyMult(context.activeCrisis);

  let happiness = base;
  happiness -= getTaxHappinessPenalty(taxRate, { taxPenaltyMult: taxMult });
  happiness -= getCrisisHappinessPenalty(crisisFx);
  happiness -= getSiegeHappinessPenalty(context.cityId ?? '', context);
  happiness -= getCyberHappinessPenalty(effects);
  happiness -= context.empireHappinessPenalty ?? 0;
  happiness = Math.round(happiness * getCyberHappinessMultiplier(effects));
  happiness = Math.round(happiness * getKbrnHappinessMultiplier(kbrn));

  const refinery = city?.buildings?.find((b) => b.id === 'refinery');
  if ((refinery?.level ?? 0) >= 5) happiness += 3;

  return clampHappiness(happiness);
}

/** Kaynak saatlik oranlarına mutluluk + siber/KBRN verim cezası uygula */
export function applyHappinessToResourceRates(resources, happiness, cyberEffects = [], kbrnEffects = []) {
  const happyMult = getHappinessProductionMultiplier(happiness);
  const cyberDebuff = getActiveCyberProductionDebuff(cyberEffects);
  const kbrnDebuff = getActiveKbrnProductionDebuff(kbrnEffects);
  const totalMult = happyMult * (1 - cyberDebuff) * (1 - kbrnDebuff);

  return asArray(resources).map((r) => {
    if (!PRODUCTION_RESOURCE_IDS.has(r.id)) {
      return { ...r, happinessMultiplier: 1, happinessPenalty: false };
    }
    const hourly = parseHourlyRate(r.rate);
    if (hourly <= 0) {
      return {
        ...r,
        happinessMultiplier: totalMult,
        happinessPenalty: totalMult < 1,
      };
    }
    return {
      ...r,
      rate: formatRate(Math.max(0, Math.floor(hourly * totalMult))),
      happinessMultiplier: totalMult,
      happinessPenalty: totalMult < 0.99,
    };
  });
}

export function formatHappinessLabel(happiness, lang = 'tr') {
  const h = clampHappiness(happiness);
  if (h >= 75) return translate(lang, 'happiness.high');
  if (h >= 45) return translate(lang, 'happiness.mid');
  if (h >= 25) return translate(lang, 'happiness.low');
  return translate(lang, 'happiness.critical');
}
