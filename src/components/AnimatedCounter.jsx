import { useEffect, useRef, useState } from 'react';

/**
 * Sayısal değerler için kısa ease-out sayaç animasyonu.
 */
export default function AnimatedCounter({ value, duration = 650, className }) {
  const target = typeof value === 'number' ? value : Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (from === to) {
      setDisplay(to);
      return undefined;
    }

    let start = null;
    let raf = 0;
    const step = (ts) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else setDisplay(to);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <span className={className}>{display}</span>;
}
