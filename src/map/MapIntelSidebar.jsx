import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLoyaltyLeaderboard } from '../lib/leaderboardApi';
import { buildMapIntelFeed, buildSpyProbeFeedItems } from '../lib/mapIntelFeed';
import { fetchSpyProbeReportsFromServer, getLastSyncUserId } from '../lib/supabaseSync';
import { useGameStore } from '../stores/gameStore';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { useLanguage } from '../context/LanguageContext';
import MapIntelFeedItem from './MapIntelFeedItem';

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
  const gameHydrating = useGameStore((s) => s.gameHydrating);
  const refreshReportsFromServer = useGameStore((s) => s.refreshReportsFromServer);
  const now = useGameStore((s) => s.now);
  const mapRouteSyncRev = useGameStore((s) => s.mapRouteSyncRev ?? 0);
  const playerName = getCurrentPlayerName();

  const [expanded, setExpanded] = useState(readIntelSidebarExpanded);
  const [rankRows, setRankRows] = useState([]);
  const [rankSource, setRankSource] = useState('loading');
  const [reportsSyncing, setReportsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem(INTEL_SIDEBAR_KEY, expanded ? '1' : '0');
  }, [expanded]);

  useEffect(() => {
    if (!expanded || gameHydrating) return undefined;
    let cancelled = false;
    setReportsSyncing(true);

    const syncIntel = async () => {
      const profileId = getLastSyncUserId();
      await refreshReportsFromServer().catch(() => {});
      if (cancelled || !profileId) return;
      const probes = await fetchSpyProbeReportsFromServer(profileId).catch(() => []);
      if (!cancelled) setSpyProbeReports(probes);
    };

    syncIntel().finally(() => {
      if (!cancelled) setReportsSyncing(false);
    });
    return () => { cancelled = true; };
  }, [expanded, gameHydrating, refreshReportsFromServer]);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const loadRanks = async () => {
      setRankSource((prev) => (prev === 'live' ? 'live' : 'loading'));
      const result = await fetchLoyaltyLeaderboard();
      if (cancelled) return;
      setRankRows((result.rows ?? []).slice(0, 5));
      setRankSource(result.source ?? 'empty');
    };

    loadRanks();
    intervalId = window.setInterval(loadRanks, 45_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRanks();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const feedLabels = useMemo(
    () => ({
      etaRemaining: t('map.intelSidebar.etaRemaining'),
      etaArriving: t('map.intelSidebar.etaArriving'),
    }),
    [t],
  );

  const spyProbeItems = useMemo(() => {
    const merged = [...(spyProbeReports ?? [])];
    for (const r of reports ?? []) {
      if (!merged.some((m) => m.id === r.id)) merged.push(r);
    }
    return buildSpyProbeFeedItems(merged, 10);
  }, [reports, spyProbeReports]);

  const feed = useMemo(
    () => buildMapIntelFeed({ newsLog, expeditions, reports, labels: feedLabels, now }),
    [newsLog, expeditions, reports, feedLabels, now, mapRouteSyncRev],
  );

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  if (!expanded) {
    return (
      <button
        type="button"
        className="map-intel-sidebar__reopen"
        onClick={toggle}
        aria-expanded={false}
        aria-label={t('map.intelSidebar.open')}
        title={t('map.intelSidebar.open')}
      >
        <span className="map-intel-sidebar__reopen-icon" aria-hidden="true">📡</span>
        <span className="map-intel-sidebar__reopen-label">İSTİHBARAT</span>
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
        <h3 className="map-intel-sidebar__title">Casusluk Sondası</h3>
        {reportsSyncing && spyProbeItems.length === 0 ? (
          <p className="map-intel-rank__empty">Raporlar senkronize ediliyor…</p>
        ) : spyProbeItems.length === 0 ? (
          <p className="map-intel-rank__empty">Tamamlanan casusluk sondası yok.</p>
        ) : (
          <ul className="map-intel-feed map-intel-feed--spy">
            {spyProbeItems.map((item) => (
              <li key={item.id} className="map-intel-feed__spy-row">
                <MapIntelFeedItem item={item} />
                {item.detail && (
                  <p className="map-intel-feed__spy-detail">{item.detail}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="map-intel-sidebar__section">
        <h3 className="map-intel-sidebar__title">{t('map.intelSidebar.liveFeed')}</h3>
        {feed.length === 0 ? (
          <p className="map-intel-rank__empty">{t('map.intelSidebar.feedEmpty')}</p>
        ) : (
          <ul className="map-intel-feed">
            {feed.map((item) => (
              <MapIntelFeedItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section className="map-intel-sidebar__section">
        <h3 className="map-intel-sidebar__title">{t('map.intelSidebar.rankings')}</h3>
        {rankSource === 'loading' ? (
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
