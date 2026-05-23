import { OPEN_MARKET_RESOURCE_IDS } from './openMarket';

const HISTORY_MS = 24 * 60 * 60 * 1000;
const MAX_POINTS = 96;
const SAMPLE_MS = 90_000;

export function seedMarketPriceHistory(prices, now = Date.now()) {
  const out = {};
  for (const id of OPEN_MARKET_RESOURCE_IDS) {
    const base = prices?.[id]?.buy ?? 50;
    const points = [];
    for (let i = MAX_POINTS - 1; i >= 0; i -= 1) {
      const t = now - (i * (HISTORY_MS / MAX_POINTS));
      const wave = Math.sin(i / 6) * 0.08 + (Math.random() - 0.5) * 0.04;
      const buy = Math.max(1, Math.round(base * (1 + wave)));
      points.push({
        t,
        buy,
        sell: Math.max(1, Math.round((prices?.[id]?.sell ?? base * 0.7) * (1 + wave * 0.6))),
      });
    }
    out[id] = points;
  }
  return out;
}

export function appendMarketPriceHistory(history, openMarketPrices, now = Date.now()) {
  const next = { ...(history ?? {}) };
  for (const id of OPEN_MARKET_RESOURCE_IDS) {
    const spot = openMarketPrices?.[id];
    if (!spot) continue;
    const arr = [...(next[id] ?? [])];
    const last = arr[arr.length - 1];
    const shouldAppend = !last
      || now - last.t >= SAMPLE_MS
      || last.buy !== spot.buy;
    if (shouldAppend) {
      arr.push({ t: now, buy: spot.buy, sell: spot.sell });
    }
    const cutoff = now - HISTORY_MS;
    next[id] = arr.filter((p) => p.t >= cutoff).slice(-MAX_POINTS);
  }
  return next;
}

export function getChartSeries(history, resourceId = 'hammadde') {
  const rows = history?.[resourceId] ?? [];
  if (rows.length < 2) return { points: [], min: 0, max: 1 };
  const buys = rows.map((r) => r.buy);
  const min = Math.min(...buys);
  const max = Math.max(...buys);
  const span = Math.max(1, max - min);
  const points = rows.map((r, i) => ({
    x: rows.length < 2 ? i : (i / (rows.length - 1)) * 100,
    y: 100 - ((r.buy - min) / span) * 100,
    price: r.buy,
    t: r.t,
  }));
  return { points, min, max };
}
