import { useState } from 'react';
import { useResourceStore } from '../stores/resourceStore';
import { calcMaxAffordable } from '../utils/resourceCosts';

export default function UnitCard({ unit }) {
  const resources = useResourceStore((s) => s.resources);
  const [qty, setQty] = useState(10);

  const handleMax = () => {
    const max = calcMaxAffordable(unit.cost, resources);
    setQty(max > 0 ? max : 1);
  };

  return (
    <article className="card unit-card">
      <div className="card-visual">{unit.image}</div>
      <div className="card-header">
        <h3>{unit.name}</h3>
        <span className="badge">Mevcut: {unit.count.toLocaleString('tr-TR')}</span>
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
      <div className="card-actions unit-card-actions">
        <div className="qty-input-wrap">
          <input
            type="number"
            className="input-qty"
            value={qty}
            min={1}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          />
          <button type="button" className="btn btn-max" onClick={handleMax} title="Mevcut kaynakla üretilebilecek en fazla">
            MAX
          </button>
        </div>
        <button type="button" className="btn btn-primary">
          Üret
        </button>
        <button type="button" className="btn btn-secondary">
          Kuyruğa Ekle
        </button>
      </div>
    </article>
  );
}
