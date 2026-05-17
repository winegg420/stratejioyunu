const LOOT_LABEL_TO_ID = {
  yemek: 'food',
  metal: 'metal',
  yakıt: 'fuel',
  para: 'money',
  enerji: 'energy',
};

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

export function refundCostWithDepotCap(resources, costStr, qty = 1) {
  if (!costStr || costStr === '—') return { resources, overflow: [] };
  const costs = costStr.split('·').map((part) => {
    const match = part.trim().match(/([\d.,]+)\s+(\S+)/);
    if (!match) return null;
    const amount = Number(match[1].replace(/\./g, '').replace(',', '.'));
    const labelMap = { yemek: 'Yemek', metal: 'Metal', yakıt: 'Yakıt', para: 'Para', enerji: 'Enerji' };
    const label = labelMap[match[2].toLowerCase()] || match[2];
    return { label, amount: amount * qty };
  }).filter(Boolean);
  return applyLootWithDepotCap(resources, costs);
}
