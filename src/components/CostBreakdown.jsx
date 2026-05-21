import { getCostShortfalls, formatEta } from '../utils/resourceEta';

function formatAmount(n) {
  return Math.floor(n).toLocaleString('tr-TR');
}

export default function CostBreakdown({ costStr, qty, resources }) {
  const lines = getCostShortfalls(costStr, qty, resources);
  const hasDeficit = lines.some((l) => l.deficit > 0);

  if (!lines.length) return null;

  return (
    <ul className={`cost-breakdown${hasDeficit ? ' cost-breakdown--deficit' : ''}`}>
      {lines.map((line) => (
        <li key={line.resourceId} className="cost-breakdown-row">
          <span className="cost-breakdown-label">
            <span className="cost-breakdown-label__icon" aria-hidden="true">
              {line.icon}
            </span>
            <span className="cost-breakdown-label__text">{line.label}</span>
          </span>
          <span className="cost-breakdown-values">
            <span className="cost-breakdown-needed">
              {formatAmount(line.current)}
              <span className="cost-breakdown-sep"> / </span>
              {formatAmount(line.needed)}
            </span>
            {line.deficit > 0 && (
              <span
                className="cost-breakdown-deficit"
                title={`Üretim hızıyla tahmini: ${formatEta(line.etaSeconds)}`}
              >
                -{formatAmount(line.deficit)}
              </span>
            )}
          </span>
          {line.deficit > 0 && (
            <span className="cost-breakdown-eta" title="Mevcut üretim hızına göre tahmini süre">
              ETA: {formatEta(line.etaSeconds)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
