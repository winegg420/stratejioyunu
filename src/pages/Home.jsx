import PageHeader from '../components/PageHeader';
import NewsFeed from '../components/NewsFeed';
import CityStatusPanel from '../components/CityStatusPanel';
import ExpeditionTrackerPanel from '../components/ExpeditionTrackerPanel';
import { newsFeed } from '../data/placeholder';
import { formatSeconds } from '../lib/gameUtils';
import { useGameStore } from '../stores/gameStore';

function QueueItem({ name, detail, remainingSeconds, queued }) {
  return (
    <li className={queued ? 'queued' : ''}>
      <span>
        {name} {detail}
      </span>
      <span className="timer">{queued ? 'Sırada' : formatSeconds(remainingSeconds)}</span>
    </li>
  );
}

export default function Home() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const activeCity = playerCities.find((c) => c.id === activeCityId);

  return (
    <div className="page home-page">
      <CityStatusPanel />
      <ExpeditionTrackerPanel />
      <PageHeader
        title="Ana Merkez"
        subtitle={`${activeCity?.name} · ${activeCity?.type} · Tüm sunucu olayları ve şehir özeti`}
      />
      <div className="home-grid">
        <section className="panel">
          <h3 className="panel-title">Aktif İnşaatlar</h3>
          <ul className="queue-list">
            {city?.constructionQueue?.map((q) => (
              <QueueItem
                key={q.id}
                name={q.name}
                detail={`→ Sv.${q.targetLevel}`}
                remainingSeconds={q.remainingSeconds}
                queued={q.queued}
              />
            ))}
          </ul>
        </section>
        <section className="panel">
          <h3 className="panel-title">Asker Üretim Kuyruğu</h3>
          <ul className="queue-list">
            {city?.productionQueue?.map((q) => (
              <QueueItem
                key={q.id}
                name={q.unit}
                detail={`×${q.count}`}
                remainingSeconds={q.remainingSeconds}
                queued={q.queued}
              />
            ))}
          </ul>
        </section>
        <section className="panel notifications-panel">
          <h3 className="panel-title">Bildirimler</h3>
          <ul className="notif-list">
            <li className="unread">Fabrika Seviye 8 için yeterli metaliniz yok.</li>
            <li>Sefer Bursa&apos;ya yola çıktı — iptal için 4 dk kaldı.</li>
            <li>Depo %92 dolu — Ambar yükseltmesi önerilir.</li>
          </ul>
        </section>
        <section className="panel span-2">
          <NewsFeed items={newsFeed} />
        </section>
      </div>
    </div>
  );
}
