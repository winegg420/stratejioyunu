import { canAffordCost } from '../utils/resourceCosts';
import { scaleResourceCostString } from './empireExpansion';
import { EMPTY_AWAY_MAP, getTroopStock } from './troopStock';

export const FOUND_CITY_COLONIST_ID = 'colonist';
export const FOUND_CITY_UNIT_LABEL = 'Göçmen / İnşaat Aracı';
export const FOUND_CITY_MIN_COLONISTS = 1;
export const FOUND_CITY_COST = '2.000 hammadde · 1.500 nüfus · 500 bütçe';

export const FOUND_CITY_DEFAULT_NAMES = ['Yeni Koloni', 'Siber Üs'];

/** Boş veya kısa isimde varsayılan koloni adı seçer (dropdown’da boş kalmaması için). */
export function resolveFoundCityName(input, existingNames = []) {
  const trimmed = String(input || '').trim();
  if (trimmed.length >= 2) return trimmed;

  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  for (const base of FOUND_CITY_DEFAULT_NAMES) {
    if (!taken.has(base.toLowerCase())) return base;
  }

  let suffix = 2;
  while (taken.has(`yeni koloni ${suffix}`)) suffix += 1;
  return `Yeni Koloni ${suffix}`;
}

export function getColonistTroop(idleTroops) {
  return idleTroops.find((t) => t.id === FOUND_CITY_COLONIST_ID);
}

export function getColonistIdleCount(idleTroops, awayMap = EMPTY_AWAY_MAP) {
  const colonist = getColonistTroop(idleTroops);
  if (!colonist) return 0;
  return getTroopStock(colonist, awayMap).idle;
}

export function resolveFoundCityCost(costMultiplier = 1) {
  return scaleResourceCostString(FOUND_CITY_COST, costMultiplier);
}

export function getFoundCityReadiness({
  idleTroops,
  resources,
  troopQty = {},
  awayMap = EMPTY_AWAY_MAP,
  costMultiplier = 1,
}) {
  const costStr = resolveFoundCityCost(costMultiplier);
  const colonistIdle = getColonistIdleCount(idleTroops, awayMap);
  const colonistInPayload = troopQty[FOUND_CITY_COLONIST_ID] || 0;
  const hasResources = canAffordCost(costStr, 1, resources);
  const hasColonistStock = colonistIdle >= FOUND_CITY_MIN_COLONISTS;
  const canOpenPanel = hasColonistStock && hasResources;

  const reasons = [];
  if (!hasColonistStock) {
    reasons.push(`En az ${FOUND_CITY_MIN_COLONISTS} ${FOUND_CITY_UNIT_LABEL} (boşta)`);
  }
  if (!hasResources) {
    reasons.push(`Kaynak: ${costStr}`);
  }

  return {
    costStr,
    costMultiplier,
    colonistIdle,
    colonistAvailable: colonistIdle,
    hasColonistStock,
    hasResources,
    canOpenPanel,
    reasons,
    canStartExpedition:
      canOpenPanel
      && colonistInPayload >= FOUND_CITY_MIN_COLONISTS
      && colonistInPayload <= colonistIdle,
  };
}

export function getFoundCityButtonTitle(readiness) {
  if (readiness.canOpenPanel) return undefined;
  return readiness.reasons.join(' · ');
}
