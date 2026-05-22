import { useMemo, useState } from 'react';

function buildSparklineHeights(seed, count = 6) {
  let hash = 0;
  const key = String(seed ?? 'intel');
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  }
  return Array.from({ length: count }, (_, i) => {
    const v = (hash + i * 41) % 100;
    return 3 + Math.round((v / 100) * 11);
  });
}

export default function IntelListRow({ seedKey, className, children }) {
  const [hovered, setHovered] = useState(false);
  const heights = useMemo(() => buildSparklineHeights(seedKey), [seedKey]);

  return (
    <li
      className={['intel-list-row', className].filter(Boolean).join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="intel-list-row__body">{children}</div>
      {hovered && (
        <span className="intel-sparkline" aria-hidden="true" title="Taktik analitik">
          <svg className="intel-sparkline__svg" viewBox="0 0 50 16" width="50" height="16">
            {heights.map((h, i) => (
              <rect
                key={i}
                className="intel-sparkline__bar"
                x={i * 8 + 1}
                y={16 - h}
                width="6"
                height={h}
                rx="0.5"
              />
            ))}
          </svg>
        </span>
      )}
    </li>
  );
}
