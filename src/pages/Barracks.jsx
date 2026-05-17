import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import { landUnits, productionQueue } from '../data/placeholder';

const queueItems = productionQueue.map((q) => ({
  label: q.unit,
  detail: `×${q.count}`,
  remaining: q.remaining,
  queued: q.queued,
}));

export default function Barracks() {
  return (
    <div className="page">
      <PageHeader title="Kışla" subtitle="Kara birlikleri — her şehirde üretilebilir." />
      <ActiveQueue
        title="Aktif Kuyruk"
        items={queueItems}
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
