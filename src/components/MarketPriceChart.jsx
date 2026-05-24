import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getChartSeries, getChartTimeAxisTicks } from '../lib/marketPriceHistory';

export default function MarketPriceChart({ resourceId = 'hammadde', className = '' }) {
  const history = useGameStore((s) => s.marketPriceHistory);
  const openMarketPrices = useGameStore((s) => s.openMarketPrices);

  const { points, min, max } = useMemo(
    () => getChartSeries(history, resourceId),
    [history, resourceId],
  );

  const timeTicks = useMemo(
    () => getChartTimeAxisTicks(history, resourceId),
    [history, resourceId],
  );

  const current = openMarketPrices?.[resourceId]?.buy ?? points[points.length - 1]?.price ?? 0;
  const pathD = points.length >= 2
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    : '';

  return (
    <div className={['market-price-chart', className].filter(Boolean).join(' ')}>
      <div className="market-price-chart__head">
        <span className="market-price-chart__label font-hud-data">24s · Hammadde Borsa</span>
        <strong className="market-price-chart__spot">{current.toLocaleString('tr-TR')} B</strong>
      </div>
      <svg
        className="market-price-chart__svg"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        role="img"
        aria-label="Son 24 saat hammadde fiyat grafiği"
      >
        <defs>
          <linearGradient id="marketChartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(57, 255, 20, 0.35)" />
            <stop offset="100%" stopColor="rgba(57, 255, 20, 0)" />
          </linearGradient>
        </defs>
        {pathD && (
          <>
            <path d={`${pathD} L 100 40 L 0 40 Z`} fill="url(#marketChartGlow)" />
            <path
              d={pathD}
              className="market-price-chart__line"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>
      {timeTicks.length > 0 && (
        <div className="market-price-chart__time-axis" aria-hidden="true">
          {timeTicks.map((tick) => (
            <span
              key={tick.label}
              className="market-price-chart__time-tick font-hud-data"
              style={{ left: `${tick.x}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      )}
      <div className="market-price-chart__axis">
        <span>{min.toLocaleString('tr-TR')}</span>
        <span>24 saat</span>
        <span>{max.toLocaleString('tr-TR')}</span>
      </div>
    </div>
  );
}
