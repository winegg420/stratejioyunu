import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { useGameStore, getExpeditionOriginLabel } from '../stores/gameStore';

export default function Expeditions() {
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
    <div className="page">
      <PageHeader
        title="Seferler"
        subtitle="Seferler her an geri çağrılabilir. Geri dönüş süresi, geri çağırma anındaki kalan süreye eşittir."
        action={(
          <Link to="/harita" className="btn btn-primary">
            Haritaya Git
          </Link>
        )}
      />

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
          <EmptyState
            icon="⚔️"
            title="Henüz aktif seferiniz yok"
            description="Haritadan bir şehir seçip ordu gönderebilirsiniz."
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
            icon="📜"
            title="Geçmiş sefer kaydı yok"
            description="Tamamlanan seferler burada listelenir."
          />
        )}
      </section>
    </div>
  );
}
