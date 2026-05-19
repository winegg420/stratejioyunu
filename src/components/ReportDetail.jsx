import { extractCityFromReportTitle, getEnemyTroopsFromReport } from '../lib/spyIntel';
import { buildLossRows, formatLossCell } from '../lib/reportLosses';
import { landUnits } from '../data/placeholder';

function LossBreakdownTable({ title, rows, fallbackText }) {
  const built = rows?.length
    ? rows
    : buildLossRows(null, fallbackText);

  if (!built.length && fallbackText) {
    return (
      <div>
        <h4>{title}</h4>
        <p className="report-loss-fallback">{fallbackText}</p>
      </div>
    );
  }

  return (
    <div className="report-loss-block">
      <h4>{title}</h4>
      <table className="report-loss-table">
        <thead>
          <tr>
            <th>Birlik</th>
            <th>Gönderilen</th>
            <th>Kayıp</th>
          </tr>
        </thead>
        <tbody>
          {built.map((row) => {
            const cell = formatLossCell(row.lost);
            return (
              <tr key={row.unitId || row.name}>
                <td>
                  {row.icon && <span aria-hidden="true">{row.icon} </span>}
                  {row.name}
                </td>
                <td>{row.sent > 0 ? row.sent.toLocaleString('tr-TR') : '—'}</td>
                <td className={cell.className}>
                  {row.note && row.lost === 0 ? row.note : cell.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportDetail({ report }) {
  if (report.filterType === 'battle') {
    const won = report.winner === 'player';
    const attackerRows = report.attackerLossRows?.length
      ? report.attackerLossRows
      : buildLossRows(report.troopPayload, report.attackerLosses, null);

    return (
      <div className="report-detail">
        <div className={`report-winner-banner ${won ? 'report-winner-banner--win' : 'report-winner-banner--loss'}`}>
          <span className="report-winner-icon" aria-hidden="true">
            {won ? '🏆' : '💀'}
          </span>
          <div>
            <strong>{won ? 'Zafer' : 'Yenilgi'}</strong>
            <span>{won ? 'Saldırı başarıyla tamamlandı' : 'Birlikleriniz geri çekildi'}</span>
          </div>
        </div>
        <dl className="report-battle-stats">
          <div>
            <dt>Saldıran</dt>
            <dd className={won ? 'report-side--winner' : 'report-side--loser'}>{report.attacker}</dd>
          </div>
          <div>
            <dt>Savunan</dt>
            <dd className={won ? 'report-side--loser' : 'report-side--winner'}>{report.defender}</dd>
          </div>
        </dl>
        <LossBreakdownTable
          title="Sizin kayıplarınız"
          rows={attackerRows}
          fallbackText={report.attackerLosses}
        />
        <LossBreakdownTable
          title="Düşman kayıpları"
          rows={report.defenderLossRows}
          fallbackText={report.defenderLosses}
        />
        {report.loot?.length > 0 ? (
          <div className="report-loot">
            <h4>Çalınan Ganimet</h4>
            <ul className="report-loot-grid">
              {report.loot.map((item) => (
                <li key={item.label} className="report-loot-item">
                  <span className="report-loot-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="report-loot-label">{item.label}</span>
                  <strong className="report-loot-amount">+{item.amount.toLocaleString('tr-TR')}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="report-no-loot">Bu savaşta ganimet ele geçirilemedi.</p>
        )}
      </div>
    );
  }

  if (report.filterType === 'spy') {
    const ok = report.intelSuccess;
    const enemyTroops = getEnemyTroopsFromReport(report);
    const cityName = report.targetCity || extractCityFromReportTitle(report.title);

    return (
      <div className="report-detail">
        <div className={`report-winner-banner ${ok ? 'report-winner-banner--intel-ok' : 'report-winner-banner--intel-fail'}`}>
          <span className="report-winner-icon" aria-hidden="true">
            {ok ? '🕵️' : '⚠️'}
          </span>
          <div>
            <strong>{ok ? 'Operasyon Başarılı' : 'Operasyon Başarısız'}</strong>
            <span>{report.findings}</span>
          </div>
        </div>
        {report.intelFields?.length > 0 && (
          <div className="report-spy-intel-grid">
            <h4>Keşif Verileri — {cityName}</h4>
            <ul className="report-intel-fields">
              {report.intelFields.map((field) => (
                <li
                  key={field.key}
                  className={field.hidden ? 'report-intel-field report-intel-field--fog' : 'report-intel-field'}
                >
                  <span className="report-intel-label">{field.label}</span>
                  {field.hidden ? (
                    <span className="report-intel-fog" aria-label="Şifreli veri">
                      <span className="cyber-fog-shimmer" />
                      ████
                    </span>
                  ) : (
                    <strong>{field.value}</strong>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {ok && enemyTroops && (
          <div className="report-spy-troops">
            <h4>Tespit Edilen Garnizon — {cityName}</h4>
            <ul>
              {landUnits
                .filter((u) => enemyTroops[u.id] > 0)
                .map((u) => (
                  <li key={u.id}>
                    {u.image} {u.name}: <strong>{Number(enemyTroops[u.id]).toLocaleString('tr-TR')}</strong>
                  </li>
                ))}
            </ul>
            <p className="report-spy-sim-hint">
              Savaş simülatöründe hedef şehir olarak &quot;{cityName}&quot; yazıp &quot;Rapora Göre Simüle Et&quot; kullanabilirsiniz.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (report.filterType === 'trade') {
    return (
      <div className="report-detail">
        <div className="report-winner-banner report-winner-banner--intel-ok">
          <span className="report-winner-icon" aria-hidden="true">
            📦
          </span>
          <div>
            <strong>Lojistik Teslimat</strong>
            <span>{report.preview}</span>
          </div>
        </div>
        <p className="report-trade-cargo">
          <strong>Kargo:</strong> {report.cargo}
        </p>
        {report.overflow?.length > 0 && (
          <p className="trade-overflow-warn" role="status">
            Depo taşması:{' '}
            {report.overflow.map((o) => `${o.amount} ${o.label}`).join(', ')}
          </p>
        )}
      </div>
    );
  }

  return null;
}
