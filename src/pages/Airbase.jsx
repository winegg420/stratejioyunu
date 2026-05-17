import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { airUnits } from '../data/placeholder';

export default function Airbase() {
  return (
    <div className="page">
      <PageHeader title="Hava Üssü" subtitle="Hava birlikleri — Havaalanı inşa edildikten sonra üretilir." />
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
