import { useState } from 'react';
import { CRISIS_TYPE, formatCrisisLabel } from '../lib/crisisEngine';
import { useGameStore } from '../stores/gameStore';

const ADMIN_CRISIS_BUTTONS = [
  { type: CRISIS_TYPE.EARTHQUAKE, label: 'Devasa Deprem', catastrophic: true },
  { type: CRISIS_TYPE.EARTHQUAKE, label: 'Bölgesel Deprem (hafif)', catastrophic: false },
  { type: CRISIS_TYPE.ECONOMIC, label: 'Ekonomik Kriz', catastrophic: false },
  { type: CRISIS_TYPE.ENERGY, label: 'Enerji Krizi', catastrophic: false },
  { type: CRISIS_TYPE.MIGRATION, label: 'Göç Dalgası', catastrophic: false },
];

export default function AdminCrisisPanel() {
  const adminTriggerCrisis = useGameStore((s) => s.adminTriggerCrisis);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const [busy, setBusy] = useState(false);

  const fire = async (opts) => {
    setBusy(true);
    adminTriggerCrisis(opts);
    setTimeout(() => setBusy(false), 400);
  };

  return (
    <section className="panel admin-crisis-panel">
      <h3 className="panel-title">[ KURUCU — GOD MODE ]</h3>
      <p className="hint admin-crisis-panel__warn">
        Yalnızca kurucu hesabı. Tetiklenen krizler anında haber akışına ve haritaya yansır.
      </p>
      {activeCrisis?.active && (
        <p className="admin-crisis-active">
          Aktif: <strong>{formatCrisisLabel(activeCrisis.type)}</strong>
          {activeCrisis.admin && ' · Kurucu protokolü'}
        </p>
      )}
      <div className="admin-crisis-grid">
        {ADMIN_CRISIS_BUTTONS.map((btn) => (
          <button
            key={`${btn.type}-${btn.label}`}
            type="button"
            className={`btn btn-danger admin-crisis-btn${btn.catastrophic ? ' admin-crisis-btn--mega' : ''}`}
            disabled={busy || activeCrisis?.active}
            onClick={() => fire({ type: btn.type, catastrophic: btn.catastrophic })}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </section>
  );
}
