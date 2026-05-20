import PageHeader from '../components/PageHeader';
import NewsFeed from '../components/NewsFeed';
import CityStatusPanel from '../components/CityStatusPanel';
import ExpeditionTrackerPanel from '../components/ExpeditionTrackerPanel';
import HomeRegionPreview from '../components/HomeRegionPreview';
import { newsFeed as staticNewsFeed } from '../data/placeholder';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { useGameStore } from '../stores/gameStore';

function QueueItem({ name, detail, endsAt, queued, now }) {
  const remaining = queued ? 0 : remainingFromEndsAt(endsAt, now);
  return (
    <li className={`queue-item${queued ? ' queue-item--queued' : ''}`}>
      <span className="queue-item__name">
        <span className="queue-item__dot" />
        {name} <span className="queue-item__detail">{detail}</span>
      </span>
      <span className="queue-item__timer font-hud-data">
        {queued ? '[ KUYRUKTA ]' : formatSeconds(remaining)}
      </span>
    </li>
  );
}

const STAT_ICONS = {
  'AKTİF SEFER': '⚔',
  'İNŞAAT KUYRUĞU': '🏗',
  'ÜRETİM KUYRUĞU': '⚙',
  'OKUNMAYAN RAPOR': '📡',
  'ŞEHİR SAYISI': '🏙',
};

function StatBlock({ label, value, sub, accent }) {
  const icon = STAT_ICONS[label] ?? '◈';
  return (
    <div
      className={[
        'home-stat-block',
        'home-stat-block--chassis',
        accent && 'home-stat-block--accent',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="home-stat-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="home-stat-body">
        <span className="home-stat-label">{label}</span>
        <span className="home-stat-value">{value}</span>
        {sub && <span className="home-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

export default function Home() {
  const liveNews = useGameStore((s) => s.newsLog ?? []);
  const globalOutbreak = useGameStore((s) => s.globalCbrnOutbreak);
  const newsItems = [
    ...(globalOutbreak?.active
      ? [{
        type: 'global-alarm',
        text: `[ GLOBAL ALARM ] Aktif: ${globalOutbreak.regionName} — karantina sürüyor`,
        time: 'CANLI',
      }]
      : []),
    ...liveNews,
    ...staticNewsFeed,
  ].slice(0, 24);
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const expeditions = useGameStore((s) => s.expeditions);
  const reports = useGameStore((s) => s.reports);

  const activeExpeditions = expeditions;
  const unreadReports = reports.filter((r) => r.isNew).length;
  const constructionCount = city?.constructionQueue?.length ?? 0;
  const productionCount = city?.productionQueue?.length ?? 0;

  return (
    <div className="page home-page page--command">
      <PageHeader
        title="Ana Merkez"
        subtitle={`${activeCity?.name ?? '—'} · ${activeCity?.type ?? ''} · Komuta Paneli`}
      />

      <div className="home-status-strip">
        <StatBlock
          label="AKTİF SEFER"
          value={activeExpeditions.length}
          sub="operasyon"
          accent={activeExpeditions.length > 0}
        />
        <StatBlock label="İNŞAAT KUYRUĞU" value={constructionCount} sub="bina" />
        <StatBlock label="ÜRETİM KUYRUĞU" value={productionCount} sub="birim" />
        <StatBlock
          label="OKUNMAYAN RAPOR"
          value={unreadReports}
          sub="rapor"
          accent={unreadReports > 0}
        />
        <StatBlock label="ŞEHİR SAYISI" value={playerCities.length} sub="aktif" />
      </div>

      <div className="home-panels-row">
        <HomeRegionPreview />
        <CityStatusPanel />
        <ExpeditionTrackerPanel />
      </div>

      <div className="home-grid">
        <section className="panel home-panel">
          <h3 className="panel-title">
            <span className="panel-title__icon">🏗️</span>
            Aktif İnşaatlar — {activeCity?.name}
          </h3>
          <ul className="queue-list">
            {city?.constructionQueue?.length > 0 ? (
              city.constructionQueue.map((q) => (
                <QueueItem
                  key={q.id}
                  name={q.name}
                  detail={`→ Sv.${q.targetLevel}`}
                  endsAt={q.endsAt}
                  queued={q.queued}
                  now={now}
                />
              ))
            ) : (
              <li className="queue-empty">Aktif inşaat yok</li>
            )}
          </ul>
        </section>

        <section className="panel home-panel">
          <h3 className="panel-title">
            <span className="panel-title__icon">⚔️</span>
            Asker Üretim Kuyruğu — {activeCity?.name}
          </h3>
          <ul className="queue-list">
            {city?.productionQueue?.length > 0 ? (
              city.productionQueue.map((q) => (
                <QueueItem
                  key={q.id}
                  name={q.unit}
                  detail={`×${q.count}`}
                  endsAt={q.endsAt}
                  queued={q.queued}
                  now={now}
                />
              ))
            ) : (
              <li className="queue-empty">Üretim kuyruğu boş</li>
            )}
          </ul>
        </section>

        <section className="panel home-panel notifications-panel">
          <h3 className="panel-title">
            <span className="panel-title__icon">📡</span>
            Sistem Bildirimleri
          </h3>
          <ul className="notif-list">
            <li className="notif-item notif-item--warn">
              <span className="notif-tag">KAYNAK</span>
              Depo %92 dolu — Ambar yükseltmesi önerilir.
            </li>
            <li className="notif-item notif-item--info">
              <span className="notif-tag">SEFER</span>
              Gelen seferler için harita sayfasını kontrol et.
            </li>
            <li className="notif-item">
              <span className="notif-tag">SİSTEM</span>
              Sunucu: Türkiye-1 Sezon — Aktif
            </li>
          </ul>
        </section>

        <section className="panel home-panel span-2">
          <h3 className="panel-title">
            <span className="panel-title__icon">🌐</span>
            Sunucu Haberleri
          </h3>
          <NewsFeed items={newsItems} />
        </section>
      </div>
    </div>
  );
}
