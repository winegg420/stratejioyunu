import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import { landUnits } from '../data/placeholder';

export default function Barracks() {
  return (
    <div className="page">
      <PageHeader title="Kışla" subtitle="Kara birlikleri — her şehirde üretilebilir." />
      <div className="card-grid">
        {landUnits.map((u, i) => (
          <UnitCard key={u.id} unit={u} showQueue={i === 0} />
        ))}
      </div>
    </div>
  );
}
