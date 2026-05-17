const POP_PER_UNIT = {
  infantry: 1,
  armor: 2,
  tank: 3,
  airdefense: 2,
  sniper: 1,
  special: 2,
  colonist: 5,
};

const POP_PER_AGENT = 2;

export function getUnitPopulationCost(unitId, count = 1) {
  const per = POP_PER_UNIT[unitId] ?? 1;
  return per * Math.max(0, count);
}

export function getAgentPopulationCost(count = 1) {
  return POP_PER_AGENT * Math.max(0, count);
}

export function getIdlePopulation(city) {
  return Math.max(0, city?.idlePopulation ?? 0);
}

export function canAffordPopulation(city, cost) {
  return getIdlePopulation(city) >= cost;
}

export function deductPopulation(city, cost) {
  const next = Math.max(0, getIdlePopulation(city) - cost);
  return { ...city, idlePopulation: next };
}

export function restorePopulation(city, cost) {
  return { ...city, idlePopulation: getIdlePopulation(city) + Math.max(0, cost) };
}

export function getDefaultIdlePopulation(city) {
  const popRes = city?.resources?.find((r) => r.id === 'food');
  if (city?.idlePopulation != null) return city.idlePopulation;
  return Math.floor((popRes?.current ?? 5000) / 10);
}

export function enrichCityPopulation(city) {
  if (city.idlePopulation != null) return city;
  return { ...city, idlePopulation: getDefaultIdlePopulation(city) };
}

export function getMaxProducibleByPopulation(city, unitId, resources, costStr, calcMaxAffordable) {
  const popCap = Math.floor(getIdlePopulation(city) / (POP_PER_UNIT[unitId] ?? 1));
  const resCap = calcMaxAffordable(costStr, resources);
  return Math.min(popCap, resCap);
}
