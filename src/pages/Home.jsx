import { useCallback, useEffect, useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import { useLanguage } from '../context/LanguageContext';
import GlobalBriefingModal from '../components/GlobalBriefingModal';
import NewsFeed from '../components/NewsFeed';
import { useAuth } from '../context/AuthContext';
import {
  hasSeenGlobalBriefing,
  markGlobalBriefingSeen,
} from '../lib/briefingStorage';
import ExpeditionTrackerPanel from '../components/ExpeditionTrackerPanel';
import StrategicManagementMatrix from '../components/StrategicManagementMatrix';
import QueueEmptyState from '../components/QueueEmptyState';
import { newsFeed as staticNewsFeed } from '../data/placeholder';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { useGameStore } from '../stores/gameStore';
import CrisisResponsePanel from '../components/CrisisResponsePanel';
import PeaceForceBanner from '../components/PeaceForceBanner';
import MilAiAdvisor from '../components/MilAiAdvisor';
import AiRadarPanel from '../components/AiRadarPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import { useGameDataReady } from '../hooks/useGameDataReady';
import { useHomeCommandStats } from '../hooks/useHomeCommandStats';
import { getProgressionState } from '../lib/progressionSystem';

const HOME_PROGRESSION_FALLBACK = Object.freeze({
  ideologyUnlocked: false,
  kbrnUnlocked: false,
});
import { formatCrisisLabel } from '../lib/crisisEngine';
import { adminLogToNewsItem } from '../lib/adminOverrideEngine';

function QueueItem({ name, detail, endsAt, queued, now, queuedLabel }) {
  const remaining = queued ? 0 : remainingFromEndsAt(endsAt, now);
  return (
    <li className={`queue-item${queued ? ' queue-item--queued' : ''}`}>
      <span className="queue-item__name">
        <span className="queue-item__dot" />
        {name} <span className="queue-item__detail">{detail}</span>
      </span>
      <span className="queue-item__timer font-hud-data">
        {queued ? queuedLabel : formatSeconds(remaining)}
      </span>
    </li>
  );
}

const WIDGET_ICONS = {
  activeOps: '⚔',
  buildQueue: '🏗',
  prodQueue: '⚙',
  unreadReports: '📡',
  cityCount: '🏙',
};

function CommandWidget({ label, value, sub, active, iconKey }) {
  const icon = WIDGET_ICONS[iconKey] ?? '◈';
  const numeric = typeof value === 'number';
  const isZero = numeric && value === 0;
  const isActive = active ?? (numeric ? value > 0 : false);
  return (
    <div
      className={[
        'home-cmd-widget',
        'glass-panel',
        isActive && 'home-cmd-widget--active',
        isZero && 'home-cmd-widget--zero',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="home-cmd-widget__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="home-cmd-widget__body">
        <span className="home-cmd-widget__label">{label}</span>
        <span className="home-cmd-widget__value">
          {numeric ? (
            <AnimatedCounter value={value} className="home-cmd-widget__counter" />
          ) : (
            value
          )}
        </span>
        {sub && <span className="home-cmd-widget__sub">{sub}</span>}
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const gameReady = useGameDataReady();
  const { playerName } = useAuth();
  const setPlayerIdeology = useGameStore((s) => s.setPlayerIdeology);
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => (activeCityId ? s.cities[activeCityId] : null));
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const progression = gameReady && city ? getProgressionState(city) : HOME_PROGRESSION_FALLBACK;
  const showIdeologyBriefing = progression.ideologyUnlocked;

  const [briefingOpen, setBriefingOpen] = useState(false);
  const [pendingIdeology, setPendingIdeology] = useState(playerIdeology);

  useEffect(() => {
    if (!playerName) return;
    if (!hasSeenGlobalBriefing(playerName)) {
      setBriefingOpen(true);
      setPendingIdeology(playerIdeology);
      return;
    }
    if (showIdeologyBriefing && !playerIdeology) {
      setBriefingOpen(true);
      setPendingIdeology(playerIdeology);
    }
  }, [playerName, playerIdeology, showIdeologyBriefing]);

  const handleBriefingAccept = useCallback(() => {
    if (showIdeologyBriefing && pendingIdeology) {
      setPlayerIdeology(pendingIdeology, { force: !playerIdeology });
    }
    markGlobalBriefingSeen(playerName);
    setBriefingOpen(false);
  }, [pendingIdeology, playerName, playerIdeology, setPlayerIdeology, showIdeologyBriefing]);

  const liveNews = useGameStore((s) => s.newsLog ?? []);
  const adminPublicLogs = useGameStore((s) => s.adminPublicLogs ?? []);
  const globalOutbreak = useGameStore((s) => s.globalCbrnOutbreak);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const newsItems = [
    ...(activeCrisis?.active
      ? [{
        type: activeCrisis.admin ? 'crisis-emergency' : 'crisis-alarm',
        text: `[ ${activeCrisis.admin ? t('pages.home.alerts.globalEmergency') : t('pages.home.alerts.naturalDisaster')} ] ${formatCrisisLabel(activeCrisis.type)}${activeCrisis.regionName ? ` — ${activeCrisis.regionName}` : ''}`,
        time: 'CANLI',
      }]
      : []),
    ...(globalOutbreak?.active
      ? [{
        type: 'global-alarm',
        text: `[ ${t('pages.home.alerts.globalAlarm')} ] ${globalOutbreak.regionName} — ${t('pages.home.alerts.quarantine')}`,
        time: 'CANLI',
      }]
      : []),
    ...(adminPublicLogs ?? []).slice(0, 8).map(adminLogToNewsItem),
    ...liveNews,
    ...staticNewsFeed,
  ].slice(0, 24);
  const now = useGameStore((s) => s.now);
  const cmdStats = useHomeCommandStats();

  const sectorReady = gameReady && Boolean(activeCity?.name && city);
  const sectorFeedLine = sectorReady
    ? (() => {
      const parts = [
        activeCity.name,
        (activeCity.type && String(activeCity.type).trim())
          ? activeCity.type
          : t('pages.home.feed.base'),
      ];
      if (activeCity.provinceName?.trim()) {
        parts.push(t('pages.home.feed.sector', { province: activeCity.provinceName.trim() }));
      }
      parts.push(t('pages.home.feed.sync'));
      return `> ${parts.join(' · ')}`;
    })()
    : t('resourceBar.syncing');

  if (!gameReady) {
    return (
      <div className="page home-page page--command home-page--loading">
        <header className="home-command-head">
          <LocalizedPageHeader
            className="home-command-page-header"
            pageKey="home"
            hideStatus
            feedLine={t('resourceBar.syncing')}
            feedPending
          />
        </header>
        <p className="home-loading-panel" role="status">
          {t('pages.home.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="page home-page page--command">
      <GlobalBriefingModal
        open={briefingOpen}
        selectedIdeology={pendingIdeology}
        onSelectIdeology={setPendingIdeology}
        onAccept={handleBriefingAccept}
        showIdeologyPick={showIdeologyBriefing}
      />
      <PeaceForceBanner />

      <div className="home-command-layout">
        <header className="home-command-head">
          <LocalizedPageHeader
            className="home-command-page-header"
            pageKey="home"
            hideStatus
            feedLine={sectorFeedLine}
            feedPending={!sectorReady}
          />
          <div className="home-command-advisors">
            <MilAiAdvisor />
            <AiRadarPanel />
          </div>
        </header>

        <CrisisResponsePanel />

        <div className="home-cmd-widgets" role="list" aria-label={t('pages.home.widgets.ariaSummary')}>
          <CommandWidget
            iconKey="activeOps"
            label={t('pages.home.widgets.activeOps')}
            value={cmdStats.activeExpeditions}
            sub={cmdStats.live
              ? t('pages.home.widgets.liveSuffix', { kind: t('pages.home.widgets.kindOps') })
              : t('pages.home.widgets.offlineSuffix', { kind: t('pages.home.widgets.kindOps') })}
            active={cmdStats.activeExpeditions > 0}
          />
          <CommandWidget
            iconKey="buildQueue"
            label={t('pages.home.widgets.buildQueue')}
            value={cmdStats.constructionCount}
            sub={cmdStats.live
              ? t('pages.home.widgets.liveSuffix', { kind: t('pages.home.widgets.kindBuilding') })
              : t('pages.home.widgets.offlineSuffix', { kind: t('pages.home.widgets.kindBuilding') })}
            active={cmdStats.constructionCount > 0}
          />
          <CommandWidget
            iconKey="prodQueue"
            label={t('pages.home.widgets.prodQueue')}
            value={cmdStats.productionCount}
            sub={cmdStats.live
              ? t('pages.home.widgets.liveSuffix', { kind: t('pages.home.widgets.kindUnit') })
              : t('pages.home.widgets.offlineSuffix', { kind: t('pages.home.widgets.kindUnit') })}
            active={cmdStats.productionCount > 0}
          />
          <CommandWidget
            iconKey="unreadReports"
            label={t('pages.home.widgets.unreadReports')}
            value={cmdStats.unreadReports}
            sub={cmdStats.live
              ? t('pages.home.widgets.liveSuffix', { kind: t('pages.home.widgets.kindReport') })
              : t('pages.home.widgets.offlineSuffix', { kind: t('pages.home.widgets.kindReport') })}
            active={cmdStats.unreadReports > 0}
          />
          <CommandWidget
            iconKey="cityCount"
            label={t('pages.home.widgets.cityCount')}
            value={playerCities.length}
            sub={t('pages.home.widgets.activeLabel')}
            active={playerCities.length > 0}
          />
        </div>

        <div className="home-command-main">
          <StrategicManagementMatrix />
          <ExpeditionTrackerPanel />
        </div>

        <div className="home-grid">
          <details className="panel home-panel home-panel--foldable glass-panel">
            <summary className="panel-title">
              <span className="panel-title__icon">🏗️</span>
              {t('pages.home.sections.activeBuilds', { name: activeCity?.name })}
            </summary>
            <ul className="queue-list">
              {city?.constructionQueue?.length > 0 ? (
                city.constructionQueue.map((q) => (
                  <QueueItem
                    key={q.id}
                    name={q.name}
                    detail={`→ ${t('common.levelShort')}${q.targetLevel}`}
                    endsAt={q.endsAt}
                    queued={q.queued}
                    now={now}
                    queuedLabel={t('pages.home.queue.queued')}
                  />
                ))
              ) : (
                <QueueEmptyState
                  tag={t('pages.home.empty.queueTag')}
                  title={t('pages.home.empty.noBuild')}
                  hint={t('pages.home.empty.noBuildHint')}
                  icon="🏗"
                />
              )}
            </ul>
          </details>

          <details className="panel home-panel home-panel--foldable glass-panel">
            <summary className="panel-title">
              <span className="panel-title__icon">⚔️</span>
              {t('pages.home.sections.prodQueue', { name: activeCity?.name })}
            </summary>
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
                    queuedLabel={t('pages.home.queue.queued')}
                  />
                ))
              ) : (
                <QueueEmptyState
                  tag={t('pages.home.empty.queueTag')}
                  title={t('pages.home.empty.noProd')}
                  hint={t('pages.home.empty.noProdHint')}
                  icon="⚙"
                />
              )}
            </ul>
          </details>

          <section className="panel home-panel home-panel--news glass-panel span-2">
            <h3 className="panel-title">
              <span className="panel-title__icon">🌐</span>
              {t('pages.home.sections.serverNews')}
            </h3>
            <NewsFeed items={newsItems} />
          </section>
        </div>
      </div>
    </div>
  );
}
