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
    <div className="report-loss-block report-ledger-block">
      <h4>{title}</h4>
      <table className="report-loss-table report-ledger-table">
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

    const ledger = report.combatLedger;

    return (
      <div className="report-detail report-detail--ledger">
        {ledger && (
          <div className={`combat-ledger-banner combat-ledger-banner--${ledger.status.toLowerCase()}`}>
            <span className="combat-ledger-tag">
              [ COMBAT LEDGER ]: {ledger.status}
            </span>
            <div className="combat-ledger-stats">
              <span>ATK {ledger.initialAttacker?.attackPower ?? '—'}</span>
              <span>DEF {ledger.initialAttacker?.defensePower ?? '—'}</span>
              <span className="combat-ledger-vs">vs</span>
              <span>ATK {ledger.initialDefender?.attackPower ?? '—'}</span>
              <span>DEF {ledger.initialDefender?.defensePower ?? '—'}</span>
            </div>
          </div>
        )}
        <div className={`report-winner-banner ${won ? 'report-winner-banner--win' : 'report-winner-banner--loss'}`}>
          <span className="report-winner-icon" aria-hidden="true">
            {won ? '🏆' : '💀'}
          </span>
          <div>
            <strong>{won ? 'Zafer' : 'Yenilgi'}</strong>
            <span>{report.preview}</span>
          </div>
        </div>
        {ledger?.rounds?.length > 0 && (
          <div className="combat-ledger-rounds report-ledger-block">
            <h4>Tur Kayıtları</h4>
            <table className="report-ledger-table">
              <thead>
                <tr>
                  <th>Tur</th>
                  <th>→ Düşman</th>
                  <th>→ Biz</th>
                  <th>Düşman ATK</th>
                  <th>Biz ATK</th>
                </tr>
              </thead>
              <tbody>
                {ledger.rounds.map((r) => (
                  <tr key={r.round}>
                    <td>R{r.round}</td>
                    <td className="combat-ledger-dmg">{r.damageToDefender}</td>
                    <td className="combat-ledger-dmg combat-ledger-dmg--hit">{r.damageToAttacker}</td>
                    <td>{r.defenderAttack}</td>
                    <td>{r.attackerAttack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ledger?.lines?.length > 0 && (
          <pre className="combat-ledger-terminal" aria-label="Savaş günlüğü">
            {ledger.lines.join('\n')}
          </pre>
        )}
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
    const caught = report.caught || report.triggersBattle;
    const ledger = report.intelLedger;
    const enemyTroops = getEnemyTroopsFromReport(report);
    const cityName = report.targetCity || extractCityFromReportTitle(report.title);

    return (
      <div className="report-detail report-detail--intel-ledger">
        {ledger && (
          <div className={`intel-ledger-banner intel-ledger-banner--${ledger.status.toLowerCase()}`}>
            <span className="intel-ledger-tag">
              [ INTELLIGENCE REPORT ]: {ledger.status}
            </span>
            <div className="intel-ledger-stats">
              <span>Casus ATK {ledger.attackerLevel}</span>
              <span>DEF {ledger.defenderLevel}</span>
              <span className="intel-ledger-vs">Δ {ledger.techDiff >= 0 ? '+' : ''}{ledger.techDiff}</span>
              <span>Derinlik {ledger.depth}</span>
            </div>
          </div>
        )}
        {caught && (
          <div className="intel-caught-alert" role="alert">
            <strong>Giriş Engellendi, Sonda Yakalandı</strong>
            <span>Düşman casusluk ağı sondayı tespit etti — garnizon ile çatışma başladı.</span>
          </div>
        )}
        <div className={`report-winner-banner ${ok ? 'report-winner-banner--intel-ok' : 'report-winner-banner--intel-fail'}`}>
          <span className="report-winner-icon" aria-hidden="true">
            {ok ? '🕵️' : '⚠️'}
          </span>
          <div>
            <strong>{ok ? 'Operasyon Başarılı' : caught ? 'Sonda Yakalandı' : 'Operasyon Başarısız'}</strong>
            <span>{report.preview || report.findings}</span>
          </div>
        </div>
        {ledger?.lines?.length > 0 && (
          <pre className="intel-ledger-terminal" aria-label="İstihbarat günlüğü">
            {ledger.lines.join('\n')}
          </pre>
        )}
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

  if (report.filterType === 'cyber') {
    const ok = report.cyberSuccess;
    const ledger = report.cyberLedger;

    return (
      <div className="report-detail report-detail--cyber-ledger">
        {ledger && (
          <div className={`cyber-ledger-banner cyber-ledger-banner--${ledger.status.toLowerCase()}`}>
            <span className="cyber-ledger-tag">
              [ CYBER OPS LEDGER ]: {ledger.status}
            </span>
            <div className="cyber-ledger-stats">
              <span>ATK FW Lv.{ledger.attackerLevel}</span>
              <span>DEF FW Lv.{ledger.defenderLevel}</span>
              <span className="cyber-ledger-vs">Δ {ledger.diff >= 0 ? '+' : ''}{ledger.diff}</span>
              <span>Sızma %{ledger.chancePct}</span>
            </div>
          </div>
        )}
        <div className={`report-winner-banner ${ok ? 'report-winner-banner--intel-ok' : 'report-winner-banner--intel-fail'}`}>
          <span className="report-winner-icon" aria-hidden="true">
            {ok ? '🦠' : '🛡️'}
          </span>
          <div>
            <strong>{ok ? 'Sızma Başarılı' : 'Virüs Temizlendi'}</strong>
            <span>{report.preview || report.findings}</span>
          </div>
        </div>
        {ledger?.lines?.length > 0 && (
          <pre className="cyber-ledger-terminal" aria-label="Siber operasyon günlüğü">
            {ledger.lines.join('\n')}
          </pre>
        )}
        {ledger?.abilityName && (
          <p className="hint">
            Operasyon: <strong>{ledger.abilityName}</strong>
            {' '}· Ajan: {ledger.agentCount}
            {ok ? ' · 1 saat %30 debuff aktif' : ''}
          </p>
        )}
      </div>
    );
  }

  if (report.filterType === 'kbrn') {
    const ledger = report.kbrnLedger;
    const alert = report.kbrnAlert;
    const ok = report.kbrnSuccess;

    return (
      <div className="report-detail report-detail--kbrn-ledger">
        {ledger && (
          <div className={`kbrn-ledger-banner kbrn-ledger-banner--${ledger.status.toLowerCase()}`}>
            <span className="kbrn-ledger-tag">
              [ KBRN OPS LEDGER ]: {ledger.status}
            </span>
            <div className="kbrn-ledger-stats">
              <span>CHEM Lv.{ledger.attackerChem}</span>
              <span>DECON Lv.{ledger.defenderDecon}</span>
              <span>Δ {ledger.diff >= 0 ? '+' : ''}{ledger.diff}</span>
              <span>Bulaşma %{ledger.chancePct}</span>
            </div>
          </div>
        )}
        {alert && report.attackerTrace && (
          <div className="kbrn-trace-alert" role="alert">
            <strong>Kaynak tespit edildi</strong>
            <span>
              {report.attackerTrace.player} — üs: {report.attackerTrace.originCity}
            </span>
          </div>
        )}
        <div className={`report-winner-banner ${ok ? 'report-winner-banner--intel-ok' : 'report-winner-banner--intel-fail'}`}>
          <span className="report-winner-icon" aria-hidden="true">
            {alert ? '☢️' : ok ? '🧪' : '🛡️'}
          </span>
          <div>
            <strong>
              {alert ? 'KBRN Alarm' : ok ? 'Kimyasal Baskı Başarılı' : 'Panzehir Engelledi'}
            </strong>
            <span>{report.preview || report.findings}</span>
          </div>
        </div>
        {ledger?.lines?.length > 0 && (
          <pre className="kbrn-ledger-terminal" aria-label="KBRN operasyon günlüğü">
            {ledger.lines.join('\n')}
          </pre>
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
