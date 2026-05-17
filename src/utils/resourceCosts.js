const LABEL_TO_ID = {
  yemek: 'food',
  metal: 'metal',
  yakıt: 'fuel',
  para: 'money',
  enerji: 'energy',
};

export function parseUnitCost(costStr) {
  if (!costStr || costStr === '—') return [];
  return costStr.split('·').map((part) => {
    const match = part.trim().match(/([\d.,]+)\s+(\S+)/);
    if (!match) return null;
    const amount = Number(match[1].replace(/\./g, '').replace(',', '.'));
    const resourceId = LABEL_TO_ID[match[2].toLowerCase()];
    if (!resourceId || Number.isNaN(amount)) return null;
    return { resourceId, amount };
  }).filter(Boolean);
}

export function calcMaxAffordable(costStr, resources) {
  const costs = parseUnitCost(costStr);
  if (!costs.length) return 0;

  let max = Infinity;
  for (const { resourceId, amount } of costs) {
    const stock = resources.find((r) => r.id === resourceId);
    if (!stock || amount <= 0) return 0;
    max = Math.min(max, Math.floor(stock.current / amount));
  }

  return max === Infinity ? 0 : Math.max(0, max);
}
