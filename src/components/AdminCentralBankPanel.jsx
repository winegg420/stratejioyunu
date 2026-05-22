import { useState } from 'react';
import {
  DEFAULT_PARITIES,
  FUEL_PRICE_MAX,
  FUEL_PRICE_MIN,
  PARITY_MAX,
  PARITY_MIN,
} from '../lib/adminOverrideEngine';
import { useGameStore } from '../stores/gameStore';

const PARITY_KEYS = ['food', 'fuel', 'hammadde', 'money'];

export default function AdminCentralBankPanel() {
  const centralBank = useGameStore((s) => s.centralBank);
  const adminSetCentralBank = useGameStore((s) => s.adminSetCentralBank);
  const [fuel, setFuel] = useState(centralBank?.fuelBasePrice ?? 1);
  const [parities, setParities] = useState({
    ...DEFAULT_PARITIES,
    ...(centralBank?.parities ?? {}),
  });
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    await adminSetCentralBank({ fuelBasePrice: Number(fuel), parities });
    setBusy(false);
  };

  return (
    <section className="panel admin-bank-panel">
      <h3 className="panel-title">Merkez Bankası Modu</h3>
      <p className="hint">
        Küresel petrol taban fiyatı ve pazar pariteleri — tüm konvoy teslimatlarını etkiler.
      </p>
      <label className="admin-bank-field">
        <span>Petrol (Fuel) taban çarpanı: ×{Number(fuel).toFixed(2)}</span>
        <input
          type="range"
          min={FUEL_PRICE_MIN}
          max={FUEL_PRICE_MAX}
          step={0.05}
          value={fuel}
          onChange={(e) => setFuel(Number(e.target.value))}
        />
      </label>
      <div className="admin-bank-parities">
        {PARITY_KEYS.map((id) => (
          <label key={id} className="admin-bank-field">
            <span>{id} paritesi: ×{Number(parities[id]).toFixed(2)}</span>
            <input
              type="range"
              min={PARITY_MIN}
              max={PARITY_MAX}
              step={0.05}
              value={parities[id] ?? 1}
              onChange={(e) => setParities((p) => ({ ...p, [id]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>
      <button type="button" className="btn btn-danger" disabled={busy} onClick={apply}>
        Merkez Bankası müdahalesini yayımla
      </button>
    </section>
  );
}
