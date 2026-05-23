import { formatCompactNumber } from '../lib/formatNumber';

export default function BudgetSpendFloater({ amount }) {
  return (
    <span className="budget-spend-float font-hud-data" role="status" aria-live="polite">
      −{formatCompactNumber(amount)} bütçe
    </span>
  );
}
