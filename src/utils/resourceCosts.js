import { buildResourceLabelToIdMap, getResourceDisplay } from '../data/resourceCatalog';

const LABEL_TO_ID = buildResourceLabelToIdMap();

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

export function canAffordCost(costStr, qty, resources) {
  if (!qty || qty <= 0) return false;
  return qty <= calcMaxAffordable(costStr, resources);
}

export function deductCost(costStr, qty, resources) {
  const costs = parseUnitCost(costStr);
  if (!costs.length || !qty || qty <= 0) return resources;

  return resources.map((r) => {
    const line = costs.find((c) => c.resourceId === r.id);
    if (!line) return r;
    const pay = line.amount * qty;
    return { ...r, current: Math.max(0, Math.floor(r.current - pay)) };
  });
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

/** Maliyet karşılanmıyorsa eksik kaynak satırları. */
export function getAffordFailure(costStr, qty, resources) {
  if (!qty || qty <= 0) {
    return { ok: false, reason: 'invalid_qty' };
  }
  const costs = parseUnitCost(costStr);
  if (!costs.length) {
    return { ok: false, reason: 'invalid_cost' };
  }
  const missing = [];
  for (const { resourceId, amount } of costs) {
    const stock = resources.find((r) => r.id === resourceId);
    const need = Math.ceil(amount * qty);
    const have = Math.floor(stock?.current ?? 0);
    if (have < need) {
      const { label } = getResourceDisplay(resourceId);
      missing.push({ resourceId, label, need, have });
    }
  }
  if (missing.length) {
    return { ok: false, reason: 'resources', missing };
  }
  return { ok: true };
}

export function formatAffordFailureMessage(failure, t) {
  if (!failure || failure.ok) return '';
  if (failure.reason === 'invalid_qty') {
    return t?.('common.invalidAmount') ?? 'Geçerli bir miktar girin';
  }
  if (failure.reason === 'invalid_cost') {
    return t?.('common.invalidCost') ?? 'Maliyet tanımsız';
  }
  if (failure.reason === 'resources' && failure.missing?.length) {
    const detail = failure.missing
      .map((m) => `${m.label}: ${m.have.toLocaleString('tr-TR')} / ${m.need.toLocaleString('tr-TR')}`)
      .join(' · ');
    const base = t?.('pages.defense.cannotAfford') ?? 'Kaynak yetersiz';
    return `${base} — ${detail}`;
  }
  return t?.('pages.defense.cannotAfford') ?? 'Kaynak yetersiz';
}
