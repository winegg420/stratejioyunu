import { buildResourceLabelToIdMap, getResourceDisplay } from '../data/resourceCatalog';

const LOOT_LABEL_TO_ID = buildResourceLabelToIdMap();

/** Sefer ganimeti — depo aşımına izin verilir, hiçbir miktar silinmez. */
export function applyExpeditionLoot(resources, lootItems = []) {
  if (!lootItems?.length) return { resources, overflow: [] };

  const overflow = [];
  const updated = resources.map((r) => {
    const loot = lootItems.find(
      (l) => LOOT_LABEL_TO_ID[l.label?.toLowerCase()] === r.id
        || l.label === r.label,
    );
    if (!loot?.amount) return r;

    const before = r.current;
    const next = before + loot.amount;
    if (r.max != null && next > r.max) {
      overflow.push({
        id: r.id,
        label: r.label,
        amount: Math.floor(next - r.max),
      });
    }
    return { ...r, current: Math.floor(next) };
  });

  return { resources: updated, overflow };
}

/** Ticaret / iade — depo tavanı uygulanır (taşan miktar kaybolur). */
export function applyLootWithDepotCap(resources, lootItems = []) {
  if (!lootItems?.length) return { resources, overflow: [] };

  const overflow = [];
  const updated = resources.map((r) => {
    const loot = lootItems.find(
      (l) => LOOT_LABEL_TO_ID[l.label?.toLowerCase()] === r.id
        || l.label === r.label,
    );
    if (!loot?.amount) return r;

    const before = r.current;
    let next = before + loot.amount;
    if (r.max != null && next > r.max) {
      const absorbed = r.max - before;
      const lost = loot.amount - Math.max(0, absorbed);
      if (lost > 0) {
        overflow.push({ label: r.label, amount: Math.floor(lost) });
      }
      next = r.max;
    }
    return { ...r, current: Math.floor(next) };
  });

  return { resources: updated, overflow };
}

export function refundResourcesWithDepotCap(resources, refundItems = []) {
  return applyLootWithDepotCap(resources, refundItems);
}

export function refundCostWithDepotCap(resources, costStr, qty = 1, refundFactor = 1) {
  if (!costStr || costStr === '—') return { resources, overflow: [] };
  const factor = Math.max(0, Math.min(1, refundFactor));
  const costs = costStr.split('·').map((part) => {
    const match = part.trim().match(/([\d.,]+)\s+(\S+)/);
    if (!match) return null;
    const amount = Math.floor(Number(match[1].replace(/\./g, '').replace(',', '.')) * factor);
    const resourceId = LOOT_LABEL_TO_ID[match[2].toLowerCase()];
    const { label } = resourceId ? getResourceDisplay(resourceId) : { label: match[2] };
    return { label, amount: amount * qty };
  }).filter(Boolean);
  return applyLootWithDepotCap(resources, costs);
}
