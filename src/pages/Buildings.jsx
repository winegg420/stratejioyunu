import PageHeader from '../components/PageHeader';
import BuildingCard from '../components/BuildingCard';
import { buildings } from '../data/placeholder';

export default function Buildings() {
  return (
    <div className="page">
      <PageHeader
        title="Binalar"
        subtitle="Aynı anda 1 bina yükseltilebilir. Diğerleri kuyruğa eklenebilir."
      />
      <div className="card-grid">
        {buildings.map((b) => (
          <BuildingCard key={b.id} building={b} />
        ))}
      </div>
    </div>
  );
}
