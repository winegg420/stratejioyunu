import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITY_STATUS_COLORS } from './mapUtils';
import { idleTroops, idleSpies } from '../data/placeholder';

const STATUS_LABELS = {
  own: 'Kendi şehriniz',
  enemy: 'Düşman şehri',
  empty: 'Boş — alınabilir',
  vassal: 'Vasal şehir',
  bot: 'Bot şehri',
  siege: 'Kuşatma altında',
};

function TroopDispatchRow({ troop, value, onChange }) {
  const handleMax = () => onChange(troop.available);

  return (
    <div className="city-panel-troop-row">
      <div className="city-panel-troop-meta">
        <span className="city-panel-troop-icon" aria-hidden="true">
          {troop.icon}
        </span>
        <div>
          <span className="city-panel-troop-name">{troop.name}</span>
          <span className="city-panel-troop-available">
            Mevcut boşta: <strong>{troop.available.toLocaleString('tr-TR')}</strong>
          </span>
        </div>
      </div>
      <div className="city-panel-troop-input">
        <input
          type="number"
          className="input-qty"
          min={0}
          max={troop.available}
          value={value}
          onChange={(e) => onChange(Math.min(troop.available, Math.max(0, Number(e.target.value) || 0)))}
        />
        <button type="button" className="btn btn-max" onClick={handleMax}>
          MAX
        </button>
      </div>
    </div>
  );
}

export default function CityDetailPanel({ city, onClose }) {
  const navigate = useNavigate();
  const [panelMode, setPanelMode] = useState(null);
  const [troopQty, setTroopQty] = useState({});
  const [spyQty, setSpyQty] = useState(0);

  useEffect(() => {
    if (!city) return undefined;
    setPanelMode(null);
    setTroopQty({});
    setSpyQty(0);
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
  const canAttack = city.status !== 'own';
  const canSpy = city.status === 'enemy' || city.status === 'bot';

  const setTroop = (id, val) => setTroopQty((prev) => ({ ...prev, [id]: val }));

  const confirmAttack = () => {
    onClose();
    navigate('/seferler');
  };

  const confirmSpy = () => {
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

        {panelMode === 'attack' && canAttack && (
          <div className="city-panel-form">
            <h3 className="city-panel-form-title">⚔️ Hızlı Saldırı</h3>
            <p className="city-panel-form-hint">Gönderilecek birlik miktarını seçin</p>
            {idleTroops.map((t) => (
              <TroopDispatchRow
                key={t.id}
                troop={t}
                value={troopQty[t.id] ?? 0}
                onChange={(v) => setTroop(t.id, v)}
              />
            ))}
            <button type="button" className="btn btn-danger" onClick={confirmAttack}>
              Seferi Başlat
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPanelMode(null)}>
              İptal
            </button>
          </div>
        )}

        {panelMode === 'spy' && canSpy && (
          <div className="city-panel-form">
            <h3 className="city-panel-form-title">🕵️ Casusluk</h3>
            <p className="city-panel-form-hint">
              Mevcut boşta casus: <strong>{idleSpies}</strong>
            </p>
            <div className="city-panel-troop-row">
              <div className="city-panel-troop-meta">
                <span className="city-panel-troop-icon" aria-hidden="true">
                  🕵️
                </span>
                <div>
                  <span className="city-panel-troop-name">Casus</span>
                  <span className="city-panel-troop-available">
                    Mevcut boşta: <strong>{idleSpies}</strong>
                  </span>
                </div>
              </div>
              <div className="city-panel-troop-input">
                <input
                  type="number"
                  className="input-qty"
                  min={0}
                  max={idleSpies}
                  value={spyQty}
                  onChange={(e) =>
                    setSpyQty(Math.min(idleSpies, Math.max(0, Number(e.target.value) || 0)))
                  }
                />
                <button type="button" className="btn btn-max" onClick={() => setSpyQty(idleSpies)}>
                  MAX
                </button>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={confirmSpy}>
              Casus Gönder
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPanelMode(null)}>
              İptal
            </button>
          </div>
        )}

        {!panelMode && (
          <div className="popup-actions city-panel-actions">
            {canAttack && (
              <button type="button" className="btn btn-danger" onClick={() => setPanelMode('attack')}>
                ⚔️ Asker Gönder
              </button>
            )}
            {canSpy && (
              <button type="button" className="btn btn-secondary" onClick={() => setPanelMode('spy')}>
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
        )}
      </aside>
    </>
  );
}
