import { getHqLevel } from './buildingUtils';
import {
  applyHappinessToResourceRates,
  computeCityHappiness,
  pruneCyberEffects,
  pruneKbrnEffects,
} from './happinessSystem';
import { BUILDING_RESOURCE_MAP, formatRate, recalculateResourceRates } from './gameUtils';
import { getIdlePopulation } from './populationUtils';

const PRODUCTION_RESOURCE_IDS = new Set(Object.values(BUILDING_RESOURCE_MAP));

export const WORKFORCE_PENALTY_FACTOR = 0.1;
export const WORKFORCE_PENALTY_LABEL = 'İşçi kalmadı — maden üretimi %90 düşürüldü';

function parseHourlyRate(rateStr) {
  const match = rateStr?.match(/\+(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function isDepotOverflow(resource) {
  return resource.max != null && resource.current > resource.max;
}

/** HQ Sv.1 ve altı — yeni oyuncu maden cezasından muaf. */
export function isNewPlayerWorkforceProtected(city) {
  if (!city || typeof city !== 'object') return true;
  return getHqLevel(city) <= 1;
}

export function hasWorkforceShortage(city) {
  if (isNewPlayerWorkforceProtected(city)) return false;
  return getIdlePopulation(city) <= 0;
}

function applyWorkforcePenalty(resources) {
  return resources.map((r) => {
    if (!PRODUCTION_RESOURCE_IDS.has(r.id)) return { ...r, workforcePenalty: false };
    const hourly = parseHourlyRate(r.rate);
    if (hourly <= 0) return { ...r, workforcePenalty: true };
    return {
      ...r,
      rate: formatRate(Math.max(0, Math.floor(hourly * WORKFORCE_PENALTY_FACTOR))),
      workforcePenalty: true,
    };
  });
}

/** VIP katman bonusu — nüfus cezasından sonra net maden üretimine uygulanır. */
function applyVipProductionBonus(resources, multiplier) {
  const mult = multiplier > 0 ? multiplier : 1;
  if (mult <= 1) return resources;

  return resources.map((r) => {
    if (!PRODUCTION_RESOURCE_IDS.has(r.id)) return { ...r, vipProductionBonus: false };
    const hourly = parseHourlyRate(r.rate);
    if (hourly <= 0) return { ...r, vipProductionBonus: false };
    return {
      ...r,
      rate: formatRate(Math.max(0, Math.floor(hourly * mult))),
      vipProductionBonus: true,
    };
  });
}

function applyDepotFreeze(resources) {
  return resources.map((r) => {
    const frozen = isDepotOverflow(r);
    if (!frozen) {
      return { ...r, productionFrozen: false };
    }
    return { ...r, rate: formatRate(0), productionFrozen: true, workforcePenalty: r.workforcePenalty ?? false };
  });
}

/** Bina oranları → işçi cezası → VIP çarpanı → depo dondurması. */
export function applyProductionFreeze(resources, buildings, cityOrIdlePop, productionMultiplier = 1) {
  const idlePop = typeof cityOrIdlePop === 'object'
    ? getIdlePopulation(cityOrIdlePop)
    : (cityOrIdlePop ?? 1);

  const city = typeof cityOrIdlePop === 'object' ? cityOrIdlePop : null;
  let withRates = recalculateResourceRates(buildings, resources);

  if (idlePop <= 0 && !isNewPlayerWorkforceProtected(city)) {
    withRates = applyWorkforcePenalty(withRates);
  }

  if (productionMultiplier > 1) {
    withRates = applyVipProductionBonus(withRates, productionMultiplier);
  }

  if (city) {
    const cyberEffects = pruneCyberEffects(city.cyberEffects);
    const kbrnEffects = pruneKbrnEffects(city.kbrnEffects);
    const happiness = computeCityHappiness(
      { ...city, cyberEffects, kbrnEffects, resources: withRates },
      { cityId: city.cityId, incomingAttacks: city._incomingAttacks, expeditions: city._expeditions },
    );
    withRates = applyHappinessToResourceRates(withRates, happiness, cyberEffects, kbrnEffects);
  }

  return applyDepotFreeze(withRates);
}
