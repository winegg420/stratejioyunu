import { formatRate, recalculateResourceRates } from './gameUtils';

export function isDepotOverflow(resource) {
  return resource.max != null && resource.current > resource.max;
}

/** Mevcut > kapasite → saatlik üretim +0/sa (production freeze). */
export function applyProductionFreeze(resources, buildings) {
  const withRates = recalculateResourceRates(buildings, resources);
  return withRates.map((r) => {
    const frozen = isDepotOverflow(r);
    if (!frozen) return { ...r, productionFrozen: false };
    return { ...r, rate: formatRate(0), productionFrozen: true };
  });
}
