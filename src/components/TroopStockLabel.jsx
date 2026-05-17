import { formatTroopStockLabel, getTroopStock } from '../lib/troopStock';

export default function TroopStockLabel({ troop, awayMap, className = '' }) {
  const stock = getTroopStock(troop, awayMap);
  return (
    <span className={`troop-stock-label ${className}`.trim()} title={formatTroopStockLabel(stock)}>
      {formatTroopStockLabel(stock)}
    </span>
  );
}
