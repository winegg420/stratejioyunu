import PageHeader from '../components/PageHeader';
import NewsFeed from '../components/NewsFeed';
import CityStatusPanel from '../components/CityStatusPanel';
import {
  newsFeed,
  constructionQueue,
  productionQueue,
  activeExpeditions,
  CITY_NAME,
  CITY_TYPE,
} from '../data/placeholder';
import { useCountdown } from '../hooks/useCountdown';

function QueueItem({ name, level, remaining, queued }) {
  const timer = useCountdown(remaining);
  return (
    <li className={queued ? 'queued' : ''}>
      <span>
        {name} {level && `→ Sv.${level}`}
      </span>
      <span className="timer">{queued ? 'Sırada' : timer}</span>
    </li>
  );
}

export default function Home() {
  return (
    <div className="page home-page">
      <CityStatusPanel />
      <PageHeader
        title="Ana Merkez"
        subtitle={`${CITY_NAME} · ${CITY_TYPE} · Tüm sunucu olayları ve şehir özeti`}
      />
      <div className="home-grid">
        <section className="panel">
          <h3 className="panel-title">Aktif İnşaatlar</h3>
          <ul className="queue-list">
            {constructionQueue.map((q) => (
              <QueueItem
                key={q.name}
                name={q.name}
                level={q.level}
                remaining={q.remaining}
                queued={q.queued}
              />
            ))}
          </ul>
        </section>
        <section className="panel">
          <h3 className="panel-title">Asker Üretim Kuyruğu</h3>
          <ul className="queue-list">
            {productionQueue.map((q) => (
              <QueueItem
                key={q.unit}
                name={q.unit}
                level={`×${q.count}`}
                remaining={q.remaining}
                queued={q.queued}
              />
            ))}
          </ul>
        </section>
        <section className="panel">
          <h3 className="panel-title">Aktif Seferler</h3>
          <ul className="expedition-mini-list">
            {activeExpeditions.map((e) => (
              <li key={e.id}>
                <strong>{e.target}</strong> — {e.type}
                <span className="timer">{e.eta}</span>
              </li>
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
