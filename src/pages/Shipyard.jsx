import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { seaUnits, CITY_TYPE } from '../data/placeholder';

export default function Shipyard() {
  const isCoastal = CITY_TYPE.includes('Kıyı');

  return (
    <div className="page">
      <PageHeader
        title="Tersane"
        subtitle="Deniz birlikleri — Tersane inşa edildikten sonra üretilir."
      />
      {!isCoastal ? (
        <div className="alert alert-warn">
          Bu şehir iç bölgede. Deniz kuvveti üretmek için kıyı şehri seçmelisiniz.
        </div>
      ) : (
        <div className="card-grid">
          {seaUnits.map((u) => (
            <LockedFeatureGate key={u.id} buildingId="shipyard" featureName={u.name}>
              <UnitCard unit={u} />
            </LockedFeatureGate>
          ))}
        </div>
      )}
    </div>
  );
}
