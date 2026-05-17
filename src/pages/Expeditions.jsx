import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { formatSeconds } from '../lib/gameUtils';
import { useGameStore } from '../stores/gameStore';

export default function Expeditions() {
  const expeditions = useGameStore((s) => s.expeditions);
  const pastExpeditions = useGameStore((s) => s.pastExpeditions);
  const hasActive = expeditions.length > 0;
  const hasPast = pastExpeditions.length > 0;

  return (
    <div className="page">
      <PageHeader
        title="Seferler"
        subtitle="Sefer saldırısı ve meydan savaşı. İlk 5 dakika içinde iptal edilebilir."
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
                <th>Hedef</th>
                <th>Tür</th>
                <th>Birim</th>
                <th>Kalan</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {expeditions.map((e) => (
                <tr key={e.id}>
                  <td>{e.target}</td>
                  <td>{e.type}</td>
                  <td>{e.troops}</td>
                  <td className="timer">{formatSeconds(e.remainingSeconds)}</td>
                  <td>
                    {e.cancellable ? (
                      <button type="button" className="btn btn-danger btn-sm">
                        İptal (5 dk)
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
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
