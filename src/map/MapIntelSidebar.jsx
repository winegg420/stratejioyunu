import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLoyaltyLeaderboard } from '../lib/leaderboardApi';
import { buildMapIntelFeed } from '../lib/mapIntelFeed';
import { useGameStore } from '../stores/gameStore';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { useLanguage } from '../context/LanguageContext';
import IntelListRow from '../components/IntelListRow';

const INTEL_SIDEBAR_KEY = 'map-intel-sidebar-expanded';

function readIntelSidebarExpanded() {
  try {
    return localStorage.getItem(INTEL_SIDEBAR_KEY) !== '0';
  } catch {
    return true;
  }
}

export default function MapIntelSidebar() {
  const { t } = useLanguage();
  const newsLog = useGameStore((s) => s.newsLog);
  const expeditions = useGameStore((s) => s.expeditions);
  const reports = useGameStore((s) => s.reports);
  const playerName = getCurrentPlayerName();

  const [expanded, setExpanded] = useState(readIntelSidebarExpanded);
  const [rankRows, setRankRows] = useState([]);
  const [rankLoading, setRankLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(INTEL_SIDEBAR_KEY, expanded ? '1' : '0');
  }, [expanded]);

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

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  if (!expanded) {
    return (
      <button
        type="button"
        className="map-intel-sidebar__tab"
        onClick={toggle}
        aria-expanded={false}
        title={t('map.intelSidebar.open')}
      >
        <span className="map-intel-sidebar__tab-icon" aria-hidden="true">◆</span>
        <span className="map-intel-sidebar__tab-label">{t('map.intelSidebar.tab')}</span>
      </button>
    );
  }

  return (
    <aside className="map-intel-sidebar map-intel-sidebar--expanded" aria-label={t('map.intelSidebar.aria')}>
      <header className="map-intel-sidebar__head">
        <span className="map-intel-sidebar__bolt" aria-hidden="true">◆</span>
        <span className="map-intel-sidebar__head-title">{t('map.intelSidebar.title')}</span>
        <button
          type="button"
          className="map-intel-sidebar__close"
          onClick={toggle}
          aria-label={t('map.intelSidebar.close')}
          title={t('map.intelSidebar.close')}
        >
          ×
        </button>
      </header>

      <section className="map-intel-sidebar__section">
        <h3 className="map-intel-sidebar__title">{t('map.intelSidebar.liveFeed')}</h3>
        {feed.length === 0 ? (
          <p className="map-intel-rank__empty">{t('map.intelSidebar.feedEmpty')}</p>
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
        <h3 className="map-intel-sidebar__title">{t('map.intelSidebar.rankings')}</h3>
        {rankLoading ? (
          <p className="map-intel-rank__empty">{t('map.intelSidebar.rankLoading')}</p>
        ) : rankRows.length === 0 ? (
          <p className="map-intel-rank__empty">{t('map.intelSidebar.rankEmpty')}</p>
        ) : (
          <ol className="map-intel-rank">
            {rankRows.map((row) => (
              <li key={row.playerName} className="map-intel-rank__row">
                <span className="map-intel-rank__pos">#{row.rank}</span>
                <span className="map-intel-rank__name">
                  {row.displayName}
                  {row.playerName === playerName && (
                    <em className="map-intel-rank__you"> {t('map.intelSidebar.you')}</em>
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
