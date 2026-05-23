import LocalizedPageHeader from '../components/LocalizedPageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { airUnits } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';

export default function Airbase() {
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name);

  return (
    <div className="page page--console">
      <LocalizedPageHeader pageKey="airbase" />
      <ActiveQueue
        title={`Aktif Kuyruk — ${cityName ?? 'Şehir'}`}
        queueType="production"
        emptyText="Hava birliği üretimi için bir uçak seçip kuyruğa ekleyin."
      />
      <div className="card-grid">
        {airUnits.map((u) => (
          <LockedFeatureGate key={u.id} buildingId="airport" featureName={u.name}>
            <UnitCard unit={u} />
          </LockedFeatureGate>
        ))}
      </div>
    </div>
  );
}
