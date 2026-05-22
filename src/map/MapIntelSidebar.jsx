import { useEffect, useMemo, useState } from 'react';
import { fetchLoyaltyLeaderboard } from '../lib/leaderboardApi';
import { buildMapIntelFeed } from '../lib/mapIntelFeed';
import { useGameStore } from '../stores/gameStore';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import IntelListRow from '../components/IntelListRow';

export default function MapIntelSidebar() {
  const newsLog = useGameStore((s) => s.newsLog);
  const expeditions = useGameStore((s) => s.expeditions);
  const reports = useGameStore((s) => s.reports);
  const playerName = getCurrentPlayerName();

  const [rankRows, setRankRows] = useState([]);
  const [rankLoading, setRankLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRankLoading(true);
      const result = await fetchLoyaltyLeaderboard();
      if (!cancelled) {
        setRankRows((result.rows ?? []).slice(0, 5));
        setRankLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const feed = useMemo(
    () => buildMapIntelFeed({ newsLog, expeditions, reports }),
    [newsLog, expeditions, reports],
  );

  return (
    <aside className="map-intel-sidebar" aria-label="Canlı cephe istihbarat paneli">
      <header className="map-intel-sidebar__head">
        <span className="map-intel-sidebar__bolt" aria-hidden="true">◆</span>
        <span>[ CEPHE İSTİHBARATI ]</span>
      </header>

      <section className="map-intel-sidebar__section">
        <h3 className="map-intel-sidebar__title">Canlı Haber Akışı</h3>
        {feed.length === 0 ? (
          <p className="map-intel-rank__empty">Cephe hattında yeni olay yok — radar dinleniyor</p>
        ) : (
          <ul className="map-intel-feed">
            {feed.map((item) => (
              <IntelListRow key={item.id} seedKey={item.id} className="map-intel-feed__item">
                <span className={['map-intel-feed__tag', item.tagClass].filter(Boolean).join(' ')}>
                  {item.tag}
                </span>
                <span className="map-intel-feed__text">{item.text}</span>
              </IntelListRow>
            ))}
          </ul>
        )}
      </section>

      <section className="map-intel-sidebar__section">
        <h3 className="map-intel-sidebar__title">Sezon — İlk 5</h3>
        {rankLoading ? (
          <p className="map-intel-rank__empty">Sıralama yükleniyor…</p>
        ) : rankRows.length === 0 ? (
          <p className="map-intel-rank__empty">
            Henüz sıralama oluşmadı — ilk sezonu tamamlayan liderler burada görünecek
          </p>
        ) : (
          <ol className="map-intel-rank">
            {rankRows.map((row) => (
              <li key={row.playerName} className="map-intel-rank__row">
                <span className="map-intel-rank__pos">#{row.rank}</span>
                <span className="map-intel-rank__name">
                  {row.displayName}
                  {row.playerName === playerName && (
                    <em className="map-intel-rank__you"> (siz)</em>
                  )}
                </span>
                <span className="map-intel-rank__score">{row.loyaltyLabel}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}
