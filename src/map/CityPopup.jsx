import { CITY_STATUS_COLORS } from './mapUtils';

const STATUS_LABELS = {
  own: 'Kendi şehriniz',
  enemy: 'Düşman şehri',
  empty: 'Boş — alınabilir',
  vassal: 'Vasal şehir',
  bot: 'Bot şehri',
  siege: 'Kuşatma altında',
};

export default function CityPopup({ city, onClose }) {
  if (!city) return null;

  const color = CITY_STATUS_COLORS[city.status] || '#9ca3af';

  return (
    <div className="city-popup">
      <button type="button" className="popup-close" onClick={onClose} aria-label="Kapat">
        ×
      </button>
      <h3>{city.name}</h3>
      <span className="status-pill" style={{ borderColor: color, color }}>
        {STATUS_LABELS[city.status]}
      </span>
      {city.owner ? (
        <>
          <dl className="popup-dl">
            <dt>Oyuncu</dt>
            <dd>{city.owner}</dd>
            <dt>Rütbe</dt>
            <dd>{city.rank || '—'}</dd>
            <dt>Toplam Nüfus</dt>
            <dd>{city.population?.toLocaleString('tr-TR') || '—'}</dd>
            <dt>Şehir Türü</dt>
            <dd>{city.type}</dd>
            <dt>İttifak</dt>
            <dd>{city.alliance || '—'}</dd>
          </dl>
          <p className="popup-hint">
            Asker sayısı, bina seviyeleri ve kaynaklar için casus göndermeniz gerekir.
          </p>
        </>
      ) : (
        <p className="popup-hint">Bu şehir boş. İlk stratejik kararınızı verin ve fethedin.</p>
      )}
      <div className="popup-actions">
        {city.status === 'empty' && (
          <button type="button" className="btn btn-primary">Şehri Seç</button>
        )}
        {city.status === 'enemy' && (
          <>
            <button type="button" className="btn btn-danger">Sefer Gönder</button>
            <button type="button" className="btn btn-secondary">Casus Gönder</button>
          </>
        )}
        {city.status === 'own' && (
          <button type="button" className="btn btn-secondary">Merkeze Git</button>
        )}
      </div>
    </div>
  );
}
