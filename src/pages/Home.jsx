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
import { formatCrisisLabel } from '../lib/crisisEngine';
import { adminLogToNewsItem } from '../lib/adminOverrideEngine';

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

function CommandWidget({ label, value, sub, active }) {
  const icon = STAT_ICONS[label] ?? '◈';
  const isActive = active ?? (typeof value === 'number' ? value > 0 : false);
  const numeric = typeof value === 'number';
  return (
    <div
      className={[
        'home-cmd-widget',
        'glass-panel',
        isActive && 'home-cmd-widget--active',
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
  const progression = gameReady ? getProgressionState(city) : { ideologyUnlocked: false, kbrnUnlocked: false };
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
        text: `[ ${activeCrisis.admin ? 'KÜRESEL ACİL DURUM' : 'DOĞAL AFET ALARMI'} ] ${formatCrisisLabel(activeCrisis.type)}${activeCrisis.regionName ? ` — ${activeCrisis.regionName}` : ''}`,
        time: 'CANLI',
      }]
      : []),
    ...(globalOutbreak?.active
      ? [{
        type: 'global-alarm',
        text: `[ GLOBAL ALARM ] Aktif: ${globalOutbreak.regionName} — karantina sürüyor`,
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
    ? [
      `> ${activeCity.name}`,
      activeCity.type ?? 'Üs',
      activeCity.provinceName ? `${activeCity.provinceName} sektörü` : null,
      'komuta hattı senkron',
    ]
      .filter(Boolean)
      .join(' · ')
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

        <div className="home-cmd-widgets" role="list" aria-label="Komuta özeti">
          <CommandWidget
            label="AKTİF SEFER"
            value={cmdStats.activeExpeditions}
            sub={cmdStats.live ? 'canlı · sefer' : 'operasyon'}
            active={cmdStats.activeExpeditions > 0}
          />
          <CommandWidget
            label="İNŞAAT KUYRUĞU"
            value={cmdStats.constructionCount}
            sub={cmdStats.live ? 'canlı · bina' : 'bina'}
            active={cmdStats.constructionCount > 0}
          />
          <CommandWidget
            label="ÜRETİM KUYRUĞU"
            value={cmdStats.productionCount}
            sub={cmdStats.live ? 'canlı · birim' : 'birim'}
            active={cmdStats.productionCount > 0}
          />
          <CommandWidget
            label="OKUNMAYAN RAPOR"
            value={cmdStats.unreadReports}
            sub={cmdStats.live ? 'canlı · rapor' : 'rapor'}
            active={cmdStats.unreadReports > 0}
          />
          <CommandWidget
            label="ŞEHİR SAYISI"
            value={playerCities.length}
            sub="aktif"
            active={playerCities.length > 0}
          />
        </div>

        <div className="home-command-main">
          <StrategicManagementMatrix />
          <ExpeditionTrackerPanel />
        </div>

        <div className="home-grid">
          <section className="panel home-panel glass-panel">
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
                <QueueEmptyState
                  tag="[ KUYRUK BOŞ ]"
                  title="Aktif inşaat yok"
                  hint="Binalar sekmesinden inşaat veya yükseltme başlatın."
                  icon="🏗"
                />
              )}
            </ul>
          </section>

          <section className="panel home-panel glass-panel">
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
                <QueueEmptyState
                  tag="[ KUYRUK BOŞ ]"
                  title="Üretim kuyruğu boş"
                  hint="Kara Kuvvetleri, Tersane veya Hava Üssü'nden birim üretin."
                  icon="⚙"
                />
              )}
            </ul>
          </section>

          <section className="panel home-panel glass-panel span-2">
            <h3 className="panel-title">
              <span className="panel-title__icon">🌐</span>
              Sunucu Haberleri
            </h3>
            <NewsFeed items={newsItems} />
          </section>
        </div>
      </div>
    </div>
  );
}
