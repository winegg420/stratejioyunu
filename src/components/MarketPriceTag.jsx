import { useEffect, useState } from 'react';
import AnimatedCounter from './AnimatedCounter';

export default function MarketPriceTag({ label, value, direction }) {
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!direction || direction === 'flat') return undefined;
    setFlash(direction);
    const t = window.setTimeout(() => setFlash(null), 520);
    return () => window.clearTimeout(t);
  }, [value, direction]);

  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '▬';

  return (
    <span
      className={[
        'market-ticker-tag',
        'font-hud-data',
        direction === 'up' && 'market-ticker-tag--up',
        direction === 'down' && 'market-ticker-tag--down',
        direction === 'flat' && 'market-ticker-tag--flat',
        flash === 'up' && 'market-ticker-tag--flash-up',
        flash === 'down' && 'market-ticker-tag--flash-down',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="market-ticker-tag__arrow" aria-hidden="true">
        {arrow}
      </span>
      {label}{' '}
      <span className="market-ticker-tag__value">
        <AnimatedCounter value={value} duration={500} />
      </span>
    </span>
  );
}
