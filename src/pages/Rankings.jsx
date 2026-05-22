import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { fetchLoyaltyLeaderboard } from '../lib/leaderboardApi';
import { formatLoyaltyScore } from '../lib/loyaltySystem';
import { IDEOLOGY_PROFILES } from '../lib/ideologySystem';
import { useGameStore } from '../stores/gameStore';
import '../styles/rankings.css';

export default function Rankings() {
  const { playerName } = useAuth();
  const myLoyalty = useGameStore((s) => s.loyaltyScore ?? 0);
  const myIdeology = useGameStore((s) => s.playerIdeology);

  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchLoyaltyLeaderboard();
      if (cancelled) return;
      setRows(result.rows ?? []);
      setSource(result.source ?? 'empty');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const myRank = rows.findIndex(
    (r) => r.playerName === playerName || r.displayName === playerName,
  );

  return (
    <div className="page page--console rankings-page">
      <PageHeader
        title="İdeoloji Sıralaması"
        subtitle="> İdeoloji sadakat tablosu — doktrine bağlı komutanlar sıralanıyor..."
        status={source === 'live' ? '[ CANLI SUNUCU ]' : '[ DEMO LİSTE ]'}
      />

      <section className="panel rankings-self card">
        <h3 className="panel-title">Sizin kayıt</h3>
        <p>
          Sadakat: <strong className="font-hud-data">{formatLoyaltyScore(myLoyalty)}</strong>
          {myRank >= 0 && (
            <>
              {' '}
              · Sıra: <strong className="font-hud-data">#{myRank + 1}</strong>
            </>
          )}
        </p>
        {myIdeology && IDEOLOGY_PROFILES[myIdeology] && (
          <p className="hint">
            Doktrin: {IDEOLOGY_PROFILES[myIdeology].emoji}{' '}
            {IDEOLOGY_PROFILES[myIdeology].label}
          </p>
        )}
      </section>

      <section className="panel rankings-table-panel">
        <h3 className="panel-title">İdeoloji İmparatorluğu</h3>
        <p className="hint rankings-hint">
          Milliyetçi sefer zaferi, Kapitalist bütçe büyümesi, Sol kaynak yardımı ve Teknokrat araştırma
          tamamlama sadakat kazandırır.
        </p>
        {loading ? (
          <p className="rankings-loading">Sıralama yükleniyor…</p>
        ) : rows.length === 0 ? (
          <p className="rankings-empty">
            Henüz sıralama oluşmadı — ilk sezonu tamamlayan liderler burada görünecek
          </p>
        ) : (
          <div className="rankings-table-wrap">
            <table className="data-table rankings-table rankings-table--terminal">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Oyuncu</th>
                  <th>İdeoloji</th>
                  <th>Sadakat</th>
                  <th>İttifak</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isMe = row.playerName === playerName || row.displayName === playerName;
                  const prof = row.ideology ? IDEOLOGY_PROFILES[row.ideology] : null;
                  return (
                    <tr key={`${row.rank}-${row.playerName}`} className={isMe ? 'is-me' : ''}>
                      <td className="font-hud-data">{row.rank}</td>
                      <td>
                        <span className="rankings-player">{row.displayName}</span>
                        {isMe && <span className="rankings-you-tag">Siz</span>}
                      </td>
                      <td>
                        {prof ? (
                          <span className="rankings-ideology" style={{ '--ideology-color': prof.color }}>
                            {prof.emoji} {row.ideologyLabel}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="font-hud-data rankings-score">{row.loyaltyLabel}</td>
                      <td>{row.alliance}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
