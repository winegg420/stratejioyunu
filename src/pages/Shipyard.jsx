import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { seaUnits } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';

export default function Shipyard() {
  const activeCity = useGameStore((s) =>
    s.playerCities.find((c) => c.id === s.activeCityId),
  );
  const isCoastal = (activeCity?.type ?? '').includes('Kıyı');

  return (
    <div className="page">
      <PageHeader
        title="Tersane"
        subtitle="Deniz birlikleri — Tersane inşa edildikten sonra üretilir."
      />
      {!isCoastal ? (
        <MilitaryEmptyState
          variant="panel"
          tag="[ KIYI GEREKLİ ]"
          icon="🌊"
          title="İç bölge — tersane kapalı"
          hint="Deniz birlikleri üretmek için kıyı şehri seçin (üst çubuktan şehir değiştirin)."
        />
      ) : (
        <>
          <ActiveQueue
            title={`Aktif Kuyruk — ${activeCity?.name ?? 'Şehir'}`}
            queueType="production"
            emptyText="Deniz birliği üretimi için bir gemi seçip kuyruğa ekleyin."
          />
          <div className="card-grid">
            {seaUnits.map((u) => (
              <LockedFeatureGate key={u.id} buildingId="shipyard" featureName={u.name}>
                <UnitCard unit={u} />
              </LockedFeatureGate>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
