import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITY_STATUS_COLORS } from './mapUtils';

const STATUS_LABELS = {
  own: 'Kendi şehriniz',
  enemy: 'Düşman şehri',
  empty: 'Boş — alınabilir',
  vassal: 'Vasal şehir',
  bot: 'Bot şehri',
  siege: 'Kuşatma altında',
};

export default function CityDetailPanel({ city, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!city) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [city, onClose]);

  if (!city) return null;

  const color = CITY_STATUS_COLORS[city.status] || '#9ca3af';
  const owner = city.owner || 'Boş';
  const cityType = city.type || '—';

  const sendArmy = () => {
    onClose();
    navigate('/seferler');
  };

  const sendSpy = () => {
    onClose();
    navigate('/istihbarat');
  };

  return (
    <>
      <button
        type="button"
        className="city-panel-backdrop"
        onClick={onClose}
        aria-label="Paneli kapat"
      />
      <aside className="city-panel" role="dialog" aria-labelledby="city-panel-title">
        <div className="city-panel-header">
          <h2 id="city-panel-title">{city.name}</h2>
          <button type="button" className="popup-close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </div>

        <span className="status-pill" style={{ borderColor: color, color }}>
          {STATUS_LABELS[city.status]}
        </span>

        <dl className="popup-dl city-panel-dl">
          <dt>Sahibi</dt>
          <dd>{owner}</dd>
          <dt>Şehir Tipi</dt>
          <dd>{cityType}</dd>
          {city.rank && (
            <>
              <dt>Rütbe</dt>
              <dd>{city.rank}</dd>
            </>
          )}
          {city.population > 0 && (
            <>
              <dt>Nüfus</dt>
              <dd>{city.population.toLocaleString('tr-TR')}</dd>
            </>
          )}
        </dl>

        <div className="popup-actions city-panel-actions">
          {city.status !== 'own' && (
            <button type="button" className="btn btn-danger" onClick={sendArmy}>
              ⚔️ Asker Gönder
            </button>
          )}
          {city.status === 'enemy' && (
            <button type="button" className="btn btn-secondary" onClick={sendSpy}>
              🕵️ Casusluk
            </button>
          )}
          {city.status === 'empty' && (
            <button type="button" className="btn btn-primary">
              Şehri Seç
            </button>
          )}
          {city.status === 'own' && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Merkeze Git
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
