import PageHeader from '../components/PageHeader';
import BuildingCard from '../components/BuildingCard';
import ActiveQueue from '../components/ActiveQueue';
import { useGameStore } from '../stores/gameStore';

export default function Buildings() {
  const buildings = useGameStore((s) => s.cities[s.activeCityId]?.buildings ?? []);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name);

  return (
    <div className="page">
      <PageHeader
        title="Binalar"
        subtitle="Aynı anda 1 bina yükseltilebilir. Diğerleri kuyruğa eklenebilir."
      />
      <ActiveQueue
        title={`Aktif Kuyruk — ${cityName}`}
        queueType="construction"
        emptyText="Şu an yükseltilen bina yok. Aşağıdan bir bina seçerek kuyruğa ekleyebilirsiniz."
      />
      <div className="card-grid">
        {buildings.map((b) => (
          <BuildingCard key={b.id} building={b} />
        ))}
      </div>
    </div>
  );
}
