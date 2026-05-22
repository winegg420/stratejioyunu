/** Şehir sosyal / siber alanları — modern askeri strateji modeli */

import { syncCityBuildingsToCatalog } from './buildingUtils';

export const DEFAULT_POPULATION = 2400;
export const DEFAULT_HAPPINESS = 72;
export const DEFAULT_TAX_RATE = 15;

export function clampHappiness(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function clampTaxRate(value) {
  return Math.max(5, Math.min(45, Math.round(Number(value) || DEFAULT_TAX_RATE)));
}

export function createDefaultCityVitality(overrides = {}) {
  return {
    population: overrides.population ?? DEFAULT_POPULATION,
    happiness: clampHappiness(overrides.happiness ?? DEFAULT_HAPPINESS),
    taxRate: clampTaxRate(overrides.taxRate ?? DEFAULT_TAX_RATE),
    cyberEffects: Array.isArray(overrides.cyberEffects) ? [...overrides.cyberEffects] : [],
    kbrnEffects: Array.isArray(overrides.kbrnEffects) ? [...overrides.kbrnEffects] : [],
    quarantine: overrides.quarantine ?? false,
  };
}

export function enrichCityModel(city, overrides = {}) {
  const vitality = createDefaultCityVitality({
    population: city?.population ?? overrides.population,
    happiness: city?.happiness ?? overrides.happiness,
    taxRate: city?.taxRate ?? overrides.taxRate,
    cyberEffects: city?.cyberEffects ?? overrides.cyberEffects,
    kbrnEffects: city?.kbrnEffects ?? overrides.kbrnEffects,
    quarantine: city?.quarantine ?? overrides.quarantine,
  });
  const buildings = city?.buildings
    ? syncCityBuildingsToCatalog(city.buildings)
    : city?.buildings;
  return { ...city, ...vitality, ...(buildings ? { buildings } : {}) };
}
