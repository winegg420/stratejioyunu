import { getResourceDisplay, sanitizeMetalWording } from '../data/resourceCatalog';
import { parseUnitCost } from '../utils/resourceCosts';

function formatCostAmount(amount) {
  return Math.ceil(amount).toLocaleString('tr-TR');
}

/** Maliyet metnini ikon + miktar chip'lerine böler (tablo / kart satırları). */
export default function CostParts({ costStr, className = '', resources = null, qty = 1 }) {
  if (!costStr || costStr === '—') {
    return <span className={`cost-parts cost-parts--empty ${className}`.trim()}>—</span>;
  }

  const parts = parseUnitCost(costStr);
  if (!parts.length) {
    return <span className={`cost-parts ${className}`.trim()}>{sanitizeMetalWording(costStr)}</span>;
  }

  return (
    <span className={['cost-parts', className].filter(Boolean).join(' ')}>
      {parts.map((part, index) => {
        const { icon, label } = getResourceDisplay(part.resourceId);
        const stock = resources?.find((r) => r.id === part.resourceId);
        const need = Math.ceil(part.amount * (qty || 1));
        const short = stock != null && Math.floor(stock.current ?? 0) < need;
        return (
          <span
            key={`${part.resourceId}-${index}`}
            className={['cost-parts__chip', short && 'cost-parts__chip--short'].filter(Boolean).join(' ')}
          >
            <span className="cost-parts__pixel" aria-hidden="true" />
            <span className="cost-parts__icon" aria-hidden="true">
              {icon}
            </span>
            <span className="cost-parts__text">
              {formatCostAmount(part.amount)} {label}
            </span>
          </span>
        );
      })}
    </span>
  );
}
