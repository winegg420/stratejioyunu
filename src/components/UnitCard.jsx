import { useState } from 'react';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { canAffordCost, calcMaxAffordable } from '../utils/resourceCosts';
import { canAffordPopulation, getUnitPopulationCost } from '../lib/populationUtils';
import CostBreakdown from './CostBreakdown';
import TroopStockLabel from './TroopStockLabel';

export default function UnitCard({ unit, awayMap }) {
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const resources = city?.resources ?? STORE_EMPTY_ARRAY;
  const enqueueProduction = useGameStore((s) => s.enqueueProduction);
  const [qtyInput, setQtyInput] = useState('10');

  const qty = Number(qtyInput);
  const validQty = Number.isFinite(qty) && qty > 0;
  const popCost = validQty ? getUnitPopulationCost(unit.id, qty) : 0;
  const canAfford = validQty && canAffordCost(unit.cost, qty, resources);
  const hasPopulation = validQty && canAffordPopulation(city, popCost);
  const canProduce = canAfford && hasPopulation;

  const handleMax = () => {
    const max = calcMaxAffordable(unit.cost, resources);
    setQtyInput(max > 0 ? String(max) : '');
  };

  const handleQtyChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setQtyInput('');
      return;
    }
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setQtyInput(String(n));
  };

  const handleProduce = () => {
    if (!canProduce) return;
    enqueueProduction(unit.id, qty);
  };

  const handleQueue = () => {
    if (!canProduce) return;
    enqueueProduction(unit.id, qty, { addToQueue: true });
  };

  return (
    <article className="card unit-card">
      <div className="card-visual">{unit.image}</div>
      <div className="card-header">
        <h3>{unit.name}</h3>
        <span className="badge badge-troop-stock">
          <TroopStockLabel
            troop={{ id: unit.id, available: unit.idle ?? unit.count }}
            awayMap={awayMap}
          />
        </span>
      </div>
      <p className="card-desc">{unit.desc}</p>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Saldırı</th>
            <th>Savunma</th>
            <th>Maliyet</th>
            <th>Süre</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{unit.attack}</td>
            <td>{unit.defense}</td>
            <td>{unit.cost}</td>
            <td>{unit.time}</td>
          </tr>
        </tbody>
      </table>
      <CostBreakdown costStr={unit.cost} qty={validQty ? qty : 0} resources={resources} />
      <div className="card-actions unit-card-actions">
        <div className="qty-input-wrap">
          <input
            type="number"
            className="input-qty"
            value={qtyInput}
            min={0}
            onChange={handleQtyChange}
          />
          <button type="button" className="btn btn-max" onClick={handleMax} title="Mevcut kaynakla üretilebilecek en fazla">
            MAX
          </button>
        </div>
        <button type="button" className="btn btn-primary" disabled={!canProduce} onClick={handleProduce}>
          Üret
        </button>
        <button type="button" className="btn btn-secondary" disabled={!canProduce} onClick={handleQueue}>
          Kuyruğa Ekle
        </button>
      </div>
    </article>
  );
}
