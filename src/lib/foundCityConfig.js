import { canAffordCost } from '../utils/resourceCosts';

export const FOUND_CITY_COLONIST_ID = 'colonist';
export const FOUND_CITY_MIN_COLONISTS = 1;
export const FOUND_CITY_MIN_TROOPS = 10;
export const FOUND_CITY_COST = '2.000 metal · 1.500 yemek · 500 para';

export function getColonistTroop(idleTroops) {
  return idleTroops.find((t) => t.id === FOUND_CITY_COLONIST_ID);
}

export function getFoundCityReadiness({ idleTroops, resources, troopQty = {} }) {
  const colonist = getColonistTroop(idleTroops);
  const colonistAvailable = colonist?.available ?? 0;
  const colonistInPayload = troopQty[FOUND_CITY_COLONIST_ID] || 0;
  const totalTroops = Object.values(troopQty).reduce((a, b) => a + (b || 0), 0);
  const hasResources = canAffordCost(FOUND_CITY_COST, 1, resources);
  const hasColonistStock = colonistAvailable >= FOUND_CITY_MIN_COLONISTS;
  const canOpenPanel = hasColonistStock && hasResources;

  const reasons = [];
  if (!hasColonistStock) {
    reasons.push(`En az ${FOUND_CITY_MIN_COLONISTS} Kolonist (boşta)`);
  }
  if (!hasResources) {
    reasons.push(`Kaynak: ${FOUND_CITY_COST}`);
  }

  return {
    colonistAvailable,
    hasColonistStock,
    hasResources,
    canOpenPanel,
    reasons,
    canStartExpedition:
      canOpenPanel
      && totalTroops >= FOUND_CITY_MIN_TROOPS
      && colonistInPayload >= FOUND_CITY_MIN_COLONISTS
      && idleTroops.every((t) => (troopQty[t.id] || 0) <= t.available),
  };
}

export function getFoundCityButtonTitle(readiness) {
  if (readiness.canOpenPanel) return undefined;
  return readiness.reasons.join(' · ');
}
