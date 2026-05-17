import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import { airUnits } from '../data/placeholder';

export default function Airbase() {
  return (
    <div className="page">
      <PageHeader title="Hava Üssü" subtitle="Hava birlikleri — havaalanı inşa edildikten sonra üretilir." />
      <div className="card-grid">
        {airUnits.map((u) => (
          <UnitCard key={u.id} unit={u} />
        ))}
      </div>
    </div>
  );
}
