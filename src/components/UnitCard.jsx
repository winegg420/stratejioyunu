import { useState } from 'react';
import { useActionLock } from '../hooks/useActionLock';
import { toRawInputNumber } from '../lib/formatNumber';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { canAffordCost, calcMaxAffordable } from '../utils/resourceCosts';
import { canAffordPopulation, getUnitPopulationCost } from '../lib/populationUtils';
import { resolveUnitInfoPayload } from '../lib/contentInfoResolver';
import TroopStockLabel from './TroopStockLabel';

export default function UnitCard({ unit, awayMap }) {
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const enqueueProduction = useGameStore((s) => s.enqueueProduction);
  const openContentInfo = useGameStore((s) => s.openContentInfo);
  const { locked: actionLocked, runLocked } = useActionLock();
  const [qtyInput, setQtyInput] = useState('10');

  const qty = Number(qtyInput);
  const validQty = Number.isFinite(qty) && qty > 0;
  const popCost = validQty ? getUnitPopulationCost(unit.id, qty) : 0;
  const canAfford = validQty && canAffordCost(unit.cost, qty, resources);
  const hasPopulation = validQty && canAffordPopulation(city, popCost);
  const canProduce = canAfford && hasPopulation;

  const handleMax = () => {
    const max = calcMaxAffordable(unit.cost, resources);
    setQtyInput(toRawInputNumber(max));
  };

  const handleQtyChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setQtyInput('');
      return;
    }
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setQtyInput(toRawInputNumber(n));
  };

  const handleProduce = () => {
    if (!canProduce || actionLocked) return;
    runLocked(() => enqueueProduction(unit.id, qty));
  };

  const handleQueue = () => {
    if (!canProduce || actionLocked) return;
    runLocked(() => enqueueProduction(unit.id, qty, { addToQueue: true }));
  };

  const openInfo = () => openContentInfo(resolveUnitInfoPayload(unit));

  return (
    <article className="card unit-card content-card--slim">
      <span className="content-card__intel-badge">[ i ]</span>
      <button
        type="button"
        className="content-card__intel-hit"
        onClick={openInfo}
        aria-label={`${unit.name} ansiklopedi`}
      >
        <div className="card-visual">{unit.image}</div>
        <div className="content-card__head unit-card-header">
          <h3>{unit.name}</h3>
          <span className="badge badge-troop-stock">
            <TroopStockLabel
              troop={{ id: unit.id, available: unit.idle ?? unit.count }}
              awayMap={awayMap}
            />
          </span>
        </div>
      </button>
      <p className="content-card__meta">
        Birim maliyeti: <strong>{unit.cost}</strong>
        {unit.time && unit.time !== '—' ? ` · ${unit.time}` : ''}
      </p>
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
        <button
          type="button"
          className={`btn btn-primary${actionLocked ? ' btn-hud-loading' : ''}`}
          disabled={!canProduce || actionLocked}
          onClick={handleProduce}
        >
          {actionLocked ? 'Yükleniyor…' : 'Üret'}
        </button>
        <button
          type="button"
          className={`btn btn-secondary${actionLocked ? ' btn-hud-loading' : ''}`}
          disabled={!canProduce || actionLocked}
          onClick={handleQueue}
        >
          {actionLocked ? 'Yükleniyor…' : 'Kuyruğa Ekle'}
        </button>
      </div>
    </article>
  );
}
