import PageHeader from '../components/PageHeader';
import BuildingCard from '../components/BuildingCard';
import ActiveQueue from '../components/ActiveQueue';
import { buildings, constructionQueue } from '../data/placeholder';

const queueItems = constructionQueue.map((q) => ({
  label: q.name,
  detail: `Seviye ${q.level}`,
  remaining: q.remaining,
  queued: q.queued,
}));

export default function Buildings() {
  return (
    <div className="page">
      <PageHeader
        title="Binalar"
        subtitle="Aynı anda 1 bina yükseltilebilir. Diğerleri kuyruğa eklenebilir."
      />
      <ActiveQueue
        title="Aktif Kuyruk"
        items={queueItems}
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

