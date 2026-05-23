import { useEffect, useMemo, useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import HistoryBookPanel from '../components/HistoryBookPanel';
import { useGameStore } from '../stores/gameStore';
import { formatIdeologyLabel } from '../lib/ideologySystem';
import { formatLoyaltyScore } from '../lib/loyaltySystem';
import { fetchSeasonLeaderboardRows } from '../lib/profileApi';
import {
  buildSeasonLeaderboard,
  formatSeasonCountdown,
  getCompetitionDef,
  getPlayerSeasonRank,
  getPlayerSeasonScore,
  SEASON_PERIOD,
} from '../lib/seasonChampionship';
import { formatDailyResetCountdown } from '../lib/dailyQuests';
import { getCurrentPlayerName } from '../lib/playerIdentity';

function SeasonBlock({ period, block, seasonStats, onClaim }) {
  const def = getCompetitionDef(block?.competitionType);
  const playerName = getCurrentPlayerName();
  const score = getPlayerSeasonScore(seasonStats, block?.competitionType);
  const [liveRows, setLiveRows] = useState([]);
  const [boardSource, setBoardSource] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchSeasonLeaderboardRows(block?.competitionType);
      if (cancelled) return;
      setLiveRows(result.rows ?? []);
      setBoardSource(result.source);
    })();
    return () => { cancelled = true; };
  }, [block?.competitionType]);

  const board = useMemo(
    () => buildSeasonLeaderboard({
      playerName,
      playerScore: score,
      liveRows,
    }),
    [playerName, score, liveRows],
  );
  const rank = getPlayerSeasonRank(board, playerName);
  const canClaim = rank != null && rank <= 3;
  const hasLiveRanking = boardSource === 'live' && liveRows.length > 0;

  return (
    <section className="panel season-block">
      <h3 className="panel-title">
        {period === SEASON_PERIOD.MONTHLY ? '📅 Aylık Sezon' : '📆 Haftalık Sezon'}
      </h3>
      <p className="hint">
        {def?.label ?? 'Yarışma'} · Sıfırlanma:{' '}
        <span className="font-hud-data">{formatSeasonCountdown(block?.endsAt)}</span>
      </p>
      <p className="season-block__score">
        Puanınız: <span className="font-hud-data">{score.toLocaleString('tr-TR')}</span>
        {rank && hasLiveRanking && (
          <>
            {' '}
            · Derece: <span className="font-hud-data">#{rank}</span>
          </>
        )}
      </p>
      {hasLiveRanking ? (
        <ol className="season-leaderboard">
          {board.slice(0, 5).map((row) => (
            <li
              key={row.playerName}
              className={row.isSelf ? 'season-leaderboard__row--self' : ''}
            >
              <span className="font-hud-data">#{row.rank}</span> {row.displayName}
              <span className="season-leaderboard__pts">{row.score.toLocaleString('tr-TR')}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="hint season-leaderboard-empty">Henüz sıralama oluşmadı</p>
      )}
      <p className="hint season-block__reward-note">
        Ödül: kozmetik unvan + sadakat puanı (hammadde/ordu yok — snowball engeli).
      </p>
      {canClaim && hasLiveRanking && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onClaim(period)}
        >
          #{rank} ödülünü al
        </button>
      )}
    </section>
  );
}

export default function SeasonQuests() {
  const [activeTab, setActiveTab] = useState('quests');

  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const loyaltyScore = useGameStore((s) => s.loyaltyScore ?? 0);
  const seasonEngagement = useGameStore((s) => s.seasonEngagement);
  const seasonStats = useGameStore((s) => s.seasonStats);
  const dailyQuests = useGameStore((s) => s.dailyQuests);
  const cosmeticTitles = useGameStore((s) => s.cosmeticTitles ?? []);
  const watchlist = useGameStore((s) => s.watchlist ?? []);
  const claimDailyQuestReward = useGameStore((s) => s.claimDailyQuestReward);
  const claimSeasonPrize = useGameStore((s) => s.claimSeasonPrize);
  const removeWatchTarget = useGameStore((s) => s.removeWatchTarget);

  return (
    <div className="page season-quests-page page--console">
      <LocalizedPageHeader pageKey="seasonQuests" />

      <div className="history-book-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quests'}
          className={`history-book-tab${activeTab === 'quests' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          🏆 Sezon & Görevler
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`history-book-tab${activeTab === 'history' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Devlet Tarih Kitabı
        </button>
      </div>

      {activeTab === 'history' ? (
        <HistoryBookPanel />
      ) : (
        <>
      <div className="season-quests-grid">
        <SeasonBlock
          period={SEASON_PERIOD.WEEKLY}
          block={seasonEngagement?.weekly}
          seasonStats={seasonStats}
          onClaim={claimSeasonPrize}
        />
        <SeasonBlock
          period={SEASON_PERIOD.MONTHLY}
          block={seasonEngagement?.monthly}
          seasonStats={seasonStats}
          onClaim={claimSeasonPrize}
        />
      </div>

      <section className="panel daily-quests-panel">
        <h3 className="panel-title">Günlük Görevler</h3>
        <p className="hint">
          Doktrin: <strong>{formatIdeologyLabel(playerIdeology)}</strong>
          {' '}
          · Sıfırlanma: <span className="font-hud-data">{formatDailyResetCountdown()}</span>
          {' '}
          · Sadakat: <span className="font-hud-data">{formatLoyaltyScore(loyaltyScore)}</span>
        </p>
        <ul className="daily-quest-list">
          {(dailyQuests?.quests ?? []).map((q) => (
            <li
              key={q.id}
              className={[
                'daily-quest-card',
                q.completed && 'daily-quest-card--done',
                q.claimed && 'daily-quest-card--claimed',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <h4>{q.title}</h4>
              <p className="hint">{q.hint}</p>
              {q.completed && !q.claimed && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => claimDailyQuestReward(q.id)}
                >
                  Ödülü al
                </button>
              )}
              {q.claimed && <span className="badge badge--ok">Alındı</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel watchlist-panel">
        <h3 className="panel-title">İstihbarat Takip Ağı</h3>
        <p className="hint">
          Takip ücretsiz değildir: casusluk + YZ seviyeniz hedefin siber+YZ savunmasından yüksek olmalı;
          {` `}
          haritada [ İSTİHBARAT AĞINA AL ] ile 2 ajan harcanır.
        </p>
        {watchlist.length === 0 ? (
          <p className="hint">Aktif takip yok — haritadan rakip seçin.</p>
        ) : (
          <ul className="watchlist-list">
            {watchlist.map((w) => (
              <li key={w.id}>
                <strong>{w.targetPlayer}</strong>
                {w.primaryCity && <span className="hint"> · {w.primaryCity}</span>}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => removeWatchTarget(w.targetPlayer)}
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cosmeticTitles.length > 0 && (
        <section className="panel cosmetic-titles-panel">
          <h3 className="panel-title">Kozmetik Askeri Unvanlar</h3>
          <ul className="cosmetic-title-list">
            {cosmeticTitles.map((t) => (
              <li key={t} className="cosmetic-title-item">
                ✦ {t}
              </li>
            ))}
          </ul>
        </section>
      )}
        </>
      )}
    </div>
  );
}
