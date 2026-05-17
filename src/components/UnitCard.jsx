import { useCountdown } from '../hooks/useCountdown';

export default function UnitCard({ unit, showQueue }) {
  const timer = useCountdown(showQueue ? '00:42:00' : '—');

  return (
    <article className="card unit-card">
      <div className="card-visual">{unit.image}</div>
      <div className="card-header">
        <h3>{unit.name}</h3>
        <span className="badge">Mevcut: {unit.count.toLocaleString('tr-TR')}</span>
      </div>
      <p className="card-desc">{unit.desc}</p>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Saldırı</th>
            <th>Savunma</th>
            <th>Maliyet</th>
            <th>Süre</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{unit.attack}</td>
            <td>{unit.defense}</td>
            <td>{unit.cost}</td>
            <td>{unit.time}</td>
          </tr>
        </tbody>
      </table>
      <div className="card-actions">
        <input type="number" className="input-qty" defaultValue={10} min={1} />
        <button type="button" className="btn btn-primary">Üret</button>
        <button type="button" className="btn btn-secondary">Kuyruğa Ekle</button>
      </div>
      {showQueue && <p className="queue-hint">Kuyruk: {timer} kaldı (örnek)</p>}
    </article>
  );
}
