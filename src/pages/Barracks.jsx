import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import { landUnits as landUnitDefs } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';

export default function Barracks() {
  const landUnits = useGameStore((s) => {
    const troops = s.cities[s.activeCityId]?.idleTroops ?? [];
    return landUnitDefs.map((u) => {
      const t = troops.find((x) => x.id === u.id);
      return { ...u, count: t?.available ?? 0 };
    });
  });

  return (
    <div className="page">
      <PageHeader title="Kışla" subtitle="Kara birlikleri — her şehirde üretilebilir." />
      <ActiveQueue
        title="Aktif Kuyruk"
        queueType="production"
        emptyText="Üretim kuyruğu boş. Bir birlik seçip üretim başlatabilirsiniz."
      />
      <div className="card-grid">
        {landUnits.map((u) => (
          <UnitCard key={u.id} unit={u} />
        ))}
      </div>
    </div>
  );
}
