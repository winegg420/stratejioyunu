export default function ReportDetail({ report }) {
  if (report.filterType === 'battle') {
    const won = report.winner === 'player';
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
            <dd>{report.attacker}</dd>
          </div>
          <div>
            <dt>Savunan</dt>
            <dd>{report.defender}</dd>
          </div>
          <div>
            <dt>Sizin kayıplar</dt>
            <dd>{report.attackerLosses}</dd>
          </div>
          <div>
            <dt>Düşman kayıpları</dt>
            <dd>{report.defenderLosses}</dd>
          </div>
        </dl>
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
      </div>
    );
  }

  return null;
}
