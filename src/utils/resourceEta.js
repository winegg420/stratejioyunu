import { parseUnitCost } from './resourceCosts';
import { ratePerSecond } from '../lib/gameUtils';

export function getCostShortfalls(costStr, qty, resources) {
  const costs = parseUnitCost(costStr);
  if (!costs.length || !qty || qty <= 0) return [];

  return costs.map(({ resourceId, amount }) => {
    const needed = amount * qty;
    const stock = resources.find((r) => r.id === resourceId);
    const current = stock?.current ?? 0;
    const deficit = Math.max(0, needed - current);
    const perSec = stock ? ratePerSecond(stock.rate) : 0;
    let etaSeconds = null;
    if (deficit > 0 && perSec > 0) {
      etaSeconds = Math.ceil(deficit / perSec);
    }
    return {
      resourceId,
      label: stock?.label ?? resourceId,
      icon: stock?.icon ?? '•',
      needed,
      current,
      deficit,
      etaSeconds,
    };
  });
}

export function formatEta(seconds) {
  if (seconds == null) return 'Üretim yok';
  if (seconds <= 0) return 'Hazır';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `~${h} sa ${m} dk`;
  if (m > 0) return `~${m} dk`;
  return `~${seconds} sn`;
}
