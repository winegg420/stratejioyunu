import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import NewExpeditionModal from '../components/NewExpeditionModal';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import MeydanBattlePanel from '../components/MeydanBattlePanel';
import { useGameStore, getExpeditionOriginLabel } from '../stores/gameStore';

export default function Expeditions() {
  const [launchOpen, setLaunchOpen] = useState(false);
  const now = useGameStore((s) => s.now);
  const expeditions = useGameStore((s) => s.expeditions);
  const playerCities = useGameStore((s) => s.playerCities);
  const pastExpeditions = useGameStore((s) => s.pastExpeditions);
  const recallExpedition = useGameStore((s) => s.recallExpedition);
  const requestMapTradeFocus = useGameStore((s) => s.requestMapTradeFocus);
  const navigate = useNavigate();

  const focusTradeOnMap = (expeditionId) => {
    requestMapTradeFocus(expeditionId);
    navigate('/harita');
  };
  const hasActive = expeditions.length > 0;
  const hasPast = pastExpeditions.length > 0;

  return (
    <div className="page page--console expeditions-page">
      <PageHeader
        className="expeditions-page-header"
        title="Seferler"
        hideStatus
        subtitle="> Sefer rotaları hesaplanıyor — kara max 5s · hava 3× hız · meydan savaşı protokolü aktif..."
        action={(
          <>
            <button
              type="button"
              className="btn btn-hud-primary"
              onClick={() => setLaunchOpen(true)}
            >
              [ YENİ SEFERE ÇIK ]
            </button>
            <Link to="/harita" className="btn btn-hud-secondary">
              Haritaya Git
            </Link>
          </>
        )}
      />

      <NewExpeditionModal open={launchOpen} onClose={() => setLaunchOpen(false)} />

      <MeydanBattlePanel />

      <section className="panel">
        <h3 className="panel-title">Aktif Seferler</h3>
        {hasActive ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Çıkış</th>
                <th>Hedef</th>
                <th>Tür</th>
                <th>Birim</th>
                <th>Kalan</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {expeditions.map((e) => {
                const origin = getExpeditionOriginLabel(e, playerCities);
                const isReturn = e.direction === 'returning' || e.recalled;
                return (
                <tr
                  key={e.id}
                  className={[
                    isReturn ? 'expedition-row-return' : '',
                    e.mode === 'trade' ? 'expedition-row-trade' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={e.mode === 'trade' ? () => focusTradeOnMap(e.id) : undefined}
                  role={e.mode === 'trade' ? 'button' : undefined}
                  tabIndex={e.mode === 'trade' ? 0 : undefined}
                  onKeyDown={
                    e.mode === 'trade'
                      ? (ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            focusTradeOnMap(e.id);
                          }
                        }
                      : undefined
                  }
                >
                  <td>{origin}</td>
                  <td>
                    {isReturn ? (
                      <span>
                        <strong className="expedition-return-tag">[GERİ DÖNÜŞ]</strong> {origin}
                      </span>
                    ) : (
                      <>
                        {e.target}
                        {e.mode === 'trade' && (
                          <span className="expedition-map-hint"> · haritada göster</span>
                        )}
                      </>
                    )}
                  </td>
                  <td>{isReturn ? 'Geri Dönüş' : e.type}</td>
                  <td>{e.troops}</td>
                  <td className="timer">{formatSeconds(remainingFromEndsAt(e.endsAt, now))}</td>
                  <td>
                    {e.direction === 'outgoing' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          recallExpedition(e.id);
                        }}
                      >
                        Geri Çağır
                      </button>
                    ) : (
                      <span className="muted">Dönüş yolunda</span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        ) : (
          <MilitaryEmptyState
            variant="radar"
            tag="[ RADAR AKTİF ]"
            icon="📡"
            title="Hareket halinde filo bulunamadı"
            hint="Haritadan hedef seçerek sefer başlatabilirsiniz."
            actionLabel="Haritayı Aç"
            actionTo="/harita"
          />
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Geçmiş Seferler</h3>
        {hasPast ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hedef</th>
                <th>Sonuç</th>
                <th>Ganimet</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {pastExpeditions.map((e) => (
                <tr key={e.id}>
                  <td>{e.target}</td>
                  <td>
                    <span className={e.result === 'Zafer' ? 'text-win' : 'text-loss'}>
                      {e.result}
                    </span>
                  </td>
                  <td>{e.loot}</td>
                  <td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            tag="[ ARŞİV BOŞ ]"
            icon="📜"
            title="Geçmiş sefer kaydı yok"
            actionLabel="Haritaya Git"
            actionTo="/harita"
            description="Tamamlanan seferler burada listelenir."
          />
        )}
      </section>
    </div>
  );
}
