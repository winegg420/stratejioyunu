import { normalizeCentralBank, DEFAULT_CENTRAL_BANK } from './adminOverrideEngine';
import { getResourceDisplay } from '../data/resourceCatalog';

/** Pazar birim fiyatları (Bütçe cinsinden) — Merkez Bankası paritesi ile ölçeklenir */
export const MARKET_TRADABLE_IDS = ['metal', 'food', 'fuel'];

const BASE_UNIT_PRICES = {
  metal: { buy: 85, sell: 58 },
  food: { buy: 14, sell: 9 },
  fuel: { buy: 28, sell: 18 },
};

export function getMarketUnitPrices(centralBank = DEFAULT_CENTRAL_BANK) {
  const bank = normalizeCentralBank(centralBank);
  const out = {};
  for (const id of MARKET_TRADABLE_IDS) {
    const base = BASE_UNIT_PRICES[id];
    const parity = bank.parities[id] ?? 1;
    const fuelMult = id === 'fuel' ? bank.fuelBasePrice : 1;
    out[id] = {
      buy: Math.max(1, Math.round(base.buy * parity * fuelMult)),
      sell: Math.max(1, Math.floor(base.sell * parity * fuelMult)),
    };
  }
  return out;
}

export function calcMarketTradeTotals(resourceId, qty, mode, centralBank) {
  const prices = getMarketUnitPrices(centralBank);
  const unit = prices[resourceId];
  if (!unit || qty <= 0) return null;
  const moneyTotal = unit[mode] * qty;
  return { moneyTotal, unitPrice: unit[mode] };
}

export function buildMarketTradeCost(resourceId, qty, mode, centralBank) {
  const totals = calcMarketTradeTotals(resourceId, qty, mode, centralBank);
  if (!totals) return null;
  if (mode === 'buy') {
    return { pay: { money: totals.moneyTotal }, receive: { [resourceId]: qty } };
  }
  return { pay: { [resourceId]: qty }, receive: { money: totals.moneyTotal } };
}

export function formatMarketPriceLabel(resourceId, centralBank) {
  const prices = getMarketUnitPrices(centralBank);
  const { label } = getResourceDisplay(resourceId);
  const p = prices[resourceId];
  if (!p) return label;
  return `${label} · Al ${p.buy} / Sat ${p.sell} Bütçe`;
}
