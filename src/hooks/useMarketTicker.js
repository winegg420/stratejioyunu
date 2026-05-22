import { useEffect, useMemo, useRef, useState } from 'react';
import { MARKET_TRADABLE_IDS, getMarketUnitPrices } from '../lib/marketExchange';

function buildSnapshot(basePrices) {
  const snap = {};
  for (const id of MARKET_TRADABLE_IDS) {
    const row = basePrices[id] ?? { buy: 0, sell: 0 };
    snap[id] = {
      buy: { value: row.buy, dir: 'flat' },
      sell: { value: row.sell, dir: 'flat' },
    };
  }
  return snap;
}

function jitterPrice(base, prev) {
  const drift = Math.round(base * (0.985 + Math.random() * 0.03));
  const value = Math.max(1, drift);
  const dir = value > prev ? 'up' : value < prev ? 'down' : 'flat';
  return { value, dir };
}

function fluctuate(basePrices, prev) {
  const next = {};
  for (const id of MARKET_TRADABLE_IDS) {
    const base = basePrices[id] ?? { buy: 0, sell: 0 };
    const row = prev[id] ?? { buy: { value: base.buy }, sell: { value: base.sell } };
    next[id] = {
      buy: jitterPrice(base.buy, row.buy.value),
      sell: jitterPrice(base.sell, row.sell.value),
    };
  }
  return next;
}

/** Merkez Bankası taban fiyatları etrafında canlı borsa tikleri. */
export function useMarketTicker(centralBank, intervalMs = 2400) {
  const basePrices = useMemo(
    () => getMarketUnitPrices(centralBank),
    [centralBank],
  );
  const [tick, setTick] = useState(() => buildSnapshot(basePrices));
  const baseRef = useRef(basePrices);
  baseRef.current = basePrices;

  useEffect(() => {
    setTick(buildSnapshot(basePrices));
  }, [basePrices]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((prev) => fluctuate(baseRef.current, prev));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return tick;
}
