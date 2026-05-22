import { getMarketUnitPrices } from './marketExchange';
import { DEFAULT_CENTRAL_BANK } from './adminOverrideEngine';

export const OPEN_MARKET_RESOURCE_IDS = ['hammadde', 'food', 'fuel'];
export const OPEN_MARKET_REF_SUPPLY = 48_000;
export const OPEN_MARKET_PRICE_CLAMP = { min: 0.52, max: 1.92 };

export function computeGlobalSupplyIndex(state) {
  let supply = 0;
  for (const city of Object.values(state?.cities ?? {})) {
    for (const r of city.resources ?? []) {
      if (OPEN_MARKET_RESOURCE_IDS.includes(r.id)) {
        supply += Math.max(0, Math.floor(r.current ?? 0));
      }
    }
  }
  for (const o of state?.marketOffers ?? []) {
    if (o.status !== 'open' || o.side !== 'sell') continue;
    supply += Math.max(0, Math.floor(o.qty ?? 0));
  }
  return supply;
}

/** Arz arttıkça fiyat düşer, kıtlıkta artar. */
export function computeOpenMarketPrices(supplyIndex, centralBank = DEFAULT_CENTRAL_BANK) {
  const base = getMarketUnitPrices(centralBank);
  const ratio = OPEN_MARKET_REF_SUPPLY / Math.max(800, supplyIndex);
  const mult = Math.max(
    OPEN_MARKET_PRICE_CLAMP.min,
    Math.min(OPEN_MARKET_PRICE_CLAMP.max, ratio),
  );
  const out = {};
  for (const id of OPEN_MARKET_RESOURCE_IDS) {
    const b = base[id];
    if (!b) continue;
    out[id] = {
      buy: Math.max(1, Math.round(b.buy * mult)),
      sell: Math.max(1, Math.floor(b.sell * mult)),
      mult: Math.round(mult * 100) / 100,
    };
  }
  return out;
}

export function tickOpenMarket(state, now = Date.now()) {
  const supplyIndex = computeGlobalSupplyIndex(state);
  const openMarketPrices = computeOpenMarketPrices(supplyIndex, state.centralBank);
  return {
    openMarketSupplyIndex: supplyIndex,
    openMarketPrices,
    openMarketUpdatedAt: now,
  };
}

export function getSpotPrice(resourceId, mode, openMarketPrices) {
  const p = openMarketPrices?.[resourceId];
  if (!p) return 0;
  return mode === 'buy' ? p.buy : p.sell;
}

export function formatSupplyTrend(supplyIndex) {
  if (supplyIndex >= OPEN_MARKET_REF_SUPPLY * 1.15) return 'Arz bol — fiyatlar düşüyor';
  if (supplyIndex <= OPEN_MARKET_REF_SUPPLY * 0.72) return 'Kıtlık — fiyatlar yükseliyor';
  return 'Piyasa dengede';
}
