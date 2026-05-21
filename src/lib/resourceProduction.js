import { getHqLevel } from './buildingUtils';
import {
  applyHappinessToResourceRates,
  computeCityHappiness,
  pruneCyberEffects,
  pruneKbrnEffects,
} from './happinessSystem';
import { getIdeologyResourceMultiplier } from './ideologySystem';
import {
  getActiveCrisisProductionDebuff,
  getEconomicCrisisMoneyMult,
  pruneCrisisEffects,
} from './crisisEngine';
import { getRegionalProductionMult } from './adminOverrideEngine';
import { applyAiMineProductionMult } from './aiCenterEngine';
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

function applyIdeologyResourceBonus(resources, playerIdeology) {
  if (!playerIdeology) return resources;

  return resources.map((r) => {
    const mult = getIdeologyResourceMultiplier(playerIdeology, r.id);
    if (!PRODUCTION_RESOURCE_IDS.has(r.id) || mult === 1) {
      return { ...r, ideologyResourceBonus: false };
    }
    const hourly = parseHourlyRate(r.rate);
    if (hourly <= 0) return { ...r, ideologyResourceBonus: false };
    return {
      ...r,
      rate: formatRate(Math.max(0, Math.floor(hourly * mult))),
      ideologyResourceBonus: mult !== 1,
    };
  });
}

/** Bina oranları → işçi cezası → VIP çarpanı → mutluluk → ideoloji → depo dondurması. */
export function applyProductionFreeze(
  resources,
  buildings,
  cityOrIdlePop,
  productionMultiplier = 1,
  playerIdeology = null,
) {
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
    const crisisEffects = pruneCrisisEffects(city.crisisEffects);
    const happiness = computeCityHappiness(
      { ...city, cyberEffects, kbrnEffects, crisisEffects, resources: withRates },
      {
        cityId: city.cityId,
        incomingAttacks: city._incomingAttacks,
        expeditions: city._expeditions,
        playerIdeology: playerIdeology ?? city._playerIdeology ?? null,
        activeCrisis: city._activeCrisis ?? null,
      },
    );
    withRates = applyHappinessToResourceRates(withRates, happiness, cyberEffects, kbrnEffects);
    withRates = applyAiMineProductionMult(withRates, city);
    const crisisDebuff = city._peaceForceShield
      ? 0
      : getActiveCrisisProductionDebuff(
        crisisEffects,
        city._activeCrisis ?? null,
      );
    if (crisisDebuff > 0) {
      withRates = withRates.map((r) => {
        if (!PRODUCTION_RESOURCE_IDS.has(r.id)) return r;
        const hourly = parseHourlyRate(r.rate);
        if (hourly <= 0) return r;
        return {
          ...r,
          rate: formatRate(Math.max(0, Math.floor(hourly * (1 - crisisDebuff)))),
          crisisPenalty: true,
        };
      });
    }
    const moneyMult = getEconomicCrisisMoneyMult(city._activeCrisis ?? null);
    if (moneyMult < 1) {
      withRates = withRates.map((r) => {
        if (r.id !== 'money') return r;
        const hourly = parseHourlyRate(r.rate);
        if (hourly <= 0) return r;
        return {
          ...r,
          rate: formatRate(Math.max(0, Math.floor(hourly * moneyMult))),
          economicCrisis: true,
        };
      });
    }
    withRates = applyIdeologyResourceBonus(
      withRates,
      playerIdeology ?? city._playerIdeology ?? null,
    );

    const regionalIncentive = city._regionalIncentive ?? null;
    const cityRegionId = city._cityRegionId ?? null;
    if (regionalIncentive?.active && cityRegionId) {
      withRates = withRates.map((r) => {
        if (!PRODUCTION_RESOURCE_IDS.has(r.id)) return r;
        const regMult = getRegionalProductionMult(regionalIncentive, cityRegionId, r.id);
        if (regMult <= 1) return r;
        const hourly = parseHourlyRate(r.rate);
        if (hourly <= 0) return r;
        return {
          ...r,
          rate: formatRate(Math.max(0, Math.floor(hourly * regMult))),
          regionalBonus: true,
        };
      });
    }
  }

  return applyDepotFreeze(withRates);
}
