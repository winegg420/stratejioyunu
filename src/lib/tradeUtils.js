const RESOURCE_IDS = ['food', 'fuel', 'metal', 'energy', 'money'];

export function sumTradeAmounts(amounts = {}) {
  return RESOURCE_IDS.reduce((sum, id) => sum + Math.max(0, Number(amounts[id]) || 0), 0);
}

export function deductTradeResources(resources, amounts) {
  return resources.map((r) => {
    const take = Math.max(0, Number(amounts[r.id]) || 0);
    if (take <= 0) return r;
    return { ...r, current: Math.max(0, r.current - take) };
  });
}

export function canAffordTrade(resources, amounts) {
  return resources.every((r) => {
    const need = Math.max(0, Number(amounts[r.id]) || 0);
    return r.current >= need;
  });
}

/** Returns overflow per resource id when adding amounts to target depot. */
export function calcTradeDepotOverflow(resources, amounts) {
  const overflow = [];
  for (const r of resources) {
    const add = Math.max(0, Number(amounts[r.id]) || 0);
    if (add <= 0 || r.max == null) continue;
    const next = r.current + add;
    if (next > r.max) {
      overflow.push({
        id: r.id,
        label: r.label,
        excess: Math.floor(next - r.max),
        wouldReceive: add,
      });
    }
  }
  return overflow;
}

export function applyTradeDelivery(resources, amounts) {
  const overflow = [];
  const next = resources.map((r) => {
    const add = Math.max(0, Number(amounts[r.id]) || 0);
    if (add <= 0) return r;
    if (r.max == null) return { ...r, current: r.current + add };
    const capped = Math.min(r.max, r.current + add);
    if (r.current + add > r.max) {
      overflow.push({
        id: r.id,
        label: r.label,
        amount: Math.floor(r.current + add - r.max),
      });
    }
    return { ...r, current: capped };
  });
  return { resources: next, overflow };
}

export function restoreTradeCargo(resources, amounts) {
  return applyTradeDelivery(resources, amounts);
}

export function formatTradeCargoSummary(amounts) {
  const parts = RESOURCE_IDS.filter((id) => (amounts[id] || 0) > 0).map((id) => {
    const labels = { food: 'Yemek', fuel: 'Yakıt', metal: 'Metal', energy: 'Enerji', money: 'Para' };
    const icons = { food: '🌾', fuel: '⛽', metal: '⚙️', energy: '⚡', money: '💰' };
    return `${icons[id]} ${amounts[id].toLocaleString('tr-TR')} ${labels[id]}`;
  });
  return parts.join(' · ') || '—';
}
