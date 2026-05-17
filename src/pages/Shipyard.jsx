import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import { seaUnits, CITY_TYPE } from '../data/placeholder';

export default function Shipyard() {
  const isCoastal = CITY_TYPE.includes('Kıyı');

  return (
    <div className="page">
      <PageHeader
        title="Tersane"
        subtitle="Deniz birlikleri — yalnızca kıyı şehirlerinde görünür."
      />
      {!isCoastal ? (
        <div className="alert alert-warn">
          Bu şehir iç bölgede. Deniz kuvveti üretmek için kıyı şehri seçmelisiniz.
        </div>
      ) : (
        <div className="card-grid">
          {seaUnits.map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
        </div>
      )}
    </div>
  );
}
