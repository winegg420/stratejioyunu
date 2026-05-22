import { useState } from 'react';
import { CBNS_REGIONS } from '../utils/cbrnEngine';
import { REGION_RESOURCE_IDS } from '../lib/adminOverrideEngine';
import { getResourceDisplay } from '../data/resourceCatalog';
import { useGameStore } from '../stores/gameStore';

export default function AdminRegionalIncentivePanel() {
  const regionalIncentive = useGameStore((s) => s.regionalIncentive);
  const adminSetRegionalIncentive = useGameStore((s) => s.adminSetRegionalIncentive);
  const adminClearRegionalIncentive = useGameStore((s) => s.adminClearRegionalIncentive);

  const [regionId, setRegionId] = useState(CBNS_REGIONS[0]?.id ?? 'karadeniz');
  const [resourceId, setResourceId] = useState('hammadde');
  const [multiplier, setMultiplier] = useState(2);
  const [durationHours, setDurationHours] = useState(168);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    await adminSetRegionalIncentive({ regionId, resourceId, multiplier, durationHours });
    setBusy(false);
  };

  const clear = async () => {
    setBusy(true);
    await adminClearRegionalIncentive();
    setBusy(false);
  };

  return (
    <section className="panel admin-incentive-panel">
      <h3 className="panel-title">Bölgesel Ödül Yağmuru</h3>
      <p className="hint">Teşvik Protokolü — seçilen bölgede kaynak üretim bonusu.</p>
      {regionalIncentive?.active && (
        <p className="admin-incentive-active">
          Aktif: <strong>{regionalIncentive.regionName}</strong>
          {' '}
          · {getResourceDisplay(regionalIncentive.resourceId).label} ×{regionalIncentive.multiplier}
        </p>
      )}
      <label className="admin-bank-field">
        <span>Bölge</span>
        <select
          className="city-switcher-select"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
        >
          {CBNS_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <label className="admin-bank-field">
        <span>Kaynak</span>
        <select
          className="city-switcher-select"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
        >
          {REGION_RESOURCE_IDS.map((id) => (
            <option key={id} value={id}>{getResourceDisplay(id).label}</option>
          ))}
        </select>
      </label>
      <label className="admin-bank-field">
        <span>Üretim çarpanı: ×{multiplier}</span>
        <input
          type="range"
          min={1.25}
          max={4}
          step={0.25}
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
        />
      </label>
      <label className="admin-bank-field">
        <span>Süre (saat): {durationHours}</span>
        <input
          type="range"
          min={24}
          max={336}
          step={24}
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
        />
      </label>
      <div className="admin-incentive-actions">
        <button type="button" className="btn btn-danger" disabled={busy} onClick={apply}>
          Teşvik protokolünü ilan et
        </button>
        {regionalIncentive?.active && (
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={clear}>
            Teşviki kaldır
          </button>
        )}
      </div>
    </section>
  );
}
