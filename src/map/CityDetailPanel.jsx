import { useEffect, useState } from 'react';
import { CITY_STATUS_COLORS } from './mapUtils';
import TroopStockLabel from '../components/TroopStockLabel';
import ExpeditionEtaStrip from '../components/ExpeditionEtaStrip';
import { EXPEDITION_DURATIONS } from '../lib/expeditionConfig';
import {
  FOUND_CITY_COST,
  FOUND_CITY_MIN_COLONISTS,
  FOUND_CITY_MIN_TROOPS,
  getFoundCityButtonTitle,
  getFoundCityReadiness,
} from '../lib/foundCityConfig';
import { isCityInOperationRange } from '../lib/mapRange';
import { useGameStore, useTroopsAwayMap } from '../stores/gameStore';

const STATUS_LABELS = {
  own: 'Kendi şehriniz',
  enemy: 'Düşman şehri',
  empty: 'Boş — alınabilir',
  vassal: 'Vasal şehir',
  bot: 'Bot şehri',
  siege: 'Kuşatma altında',
};

function TroopDispatchRow({ troop, value, onChange, awayMap }) {
  const handleMax = () => onChange(troop.available);

  return (
    <div className="city-panel-troop-row">
      <div className="city-panel-troop-meta">
        <span className="city-panel-troop-icon" aria-hidden="true">
          {troop.icon}
        </span>
        <div>
          <span className="city-panel-troop-name">{troop.name}</span>
          <TroopStockLabel troop={troop} awayMap={awayMap} className="city-panel-troop-stock" />
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
  const [panelMode, setPanelMode] = useState(null);
  const [troopQty, setTroopQty] = useState({});
  const [spyQty, setSpyQty] = useState(0);

  const activeCityId = useGameStore((s) => s.activeCityId);
  const activeCityName = useGameStore(
    (s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name ?? '',
  );
  const idleTroops = useGameStore((s) => s.cities[s.activeCityId]?.idleTroops ?? []);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? []);
  const idleSpies = useGameStore((s) => s.cities[s.activeCityId]?.idleSpies ?? 0);
  const awayMap = useTroopsAwayMap(activeCityId);
  const startExpedition = useGameStore((s) => s.startExpedition);
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  useEffect(() => {
    setTroopQty({});
    setSpyQty(0);
  }, [activeCityId]);

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
  const inRadarRange = isCityInOperationRange(city, activeCityId, playerCities, mapCities);
  const canFound = city.status === 'empty' && inRadarRange
    && !playerCities.some((c) => c.name === city.name);
  const canAttack = city.status !== 'own' && city.status !== 'empty' && inRadarRange;
  const canSpy = (city.status === 'enemy' || city.status === 'bot') && inRadarRange;
  const outOfRange = city.status !== 'own' && !inRadarRange;

  const setTroop = (id, val) => setTroopQty((prev) => ({ ...prev, [id]: val }));

  const attackTotal = Object.values(troopQty).reduce((a, b) => a + (b || 0), 0);
  const canStartAttack = attackTotal >= 1 && idleTroops.every((t) => (troopQty[t.id] || 0) <= t.available);
  const canStartSpy = spyQty >= 1 && spyQty <= idleSpies;

  const confirmAttack = () => {
    if (!canStartAttack) return;
    const ok = startExpedition({ targetCity: city, troopQty, mode: 'attack' });
    if (ok) onClose();
  };

  const confirmSpy = () => {
    if (!canStartSpy) return;
    const ok = startExpedition({ targetCity: city, troopQty: { spies: spyQty }, mode: 'spy' });
    if (ok) onClose();
  };

  const foundReadiness = getFoundCityReadiness({ idleTroops, resources, troopQty });
  const foundButtonTitle = getFoundCityButtonTitle(foundReadiness);
  const canOpenFound = canFound && foundReadiness.canOpenPanel;

  const confirmFound = () => {
    if (!foundReadiness.canStartExpedition) return;
    const ok = startExpedition({ targetCity: city, troopQty, mode: 'found' });
    if (ok) onClose();
  };

  return (
    <>
      <button type="button" className="city-panel-backdrop" onClick={onClose} aria-label="Paneli kapat" />
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
            <p className="city-panel-form-hint city-panel-origin-hint">
              Çıkış şehri: <strong>{activeCityName}</strong> — birlikler yalnızca bu şehirden düşer
            </p>
            <p className="city-panel-form-hint">Gönderilecek birlik miktarını seçin</p>
            <ExpeditionEtaStrip durationSeconds={EXPEDITION_DURATIONS.attack} />
            {idleTroops.map((t) => (
              <TroopDispatchRow
                key={t.id}
                troop={t}
                awayMap={awayMap}
                value={troopQty[t.id] ?? 0}
                onChange={(v) => setTroop(t.id, v)}
              />
            ))}
            <button type="button" className="btn btn-danger" disabled={!canStartAttack} onClick={confirmAttack}>
              Seferi Başlat
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPanelMode(null)}>
              İptal
            </button>
          </div>
        )}

        {panelMode === 'found' && canOpenFound && (
          <div className="city-panel-form">
            <h3 className="city-panel-form-title">🏙️ Şehir Kur</h3>
            <p className="city-panel-form-hint city-panel-origin-hint">
              Çıkış şehri: <strong>{activeCityName}</strong> — kolonistler bu şehirden ayrılır
            </p>
            <p className="city-panel-form-hint">
              En az <strong>{FOUND_CITY_MIN_TROOPS} birlik</strong> (en az{' '}
              <strong>{FOUND_CITY_MIN_COLONISTS} Kolonist</strong>) ve{' '}
              <strong>{FOUND_CITY_COST}</strong> gerekir.
            </p>
            <ExpeditionEtaStrip durationSeconds={EXPEDITION_DURATIONS.found} />
            {idleTroops.map((t) => (
              <TroopDispatchRow
                key={t.id}
                troop={t}
                awayMap={awayMap}
                value={troopQty[t.id] ?? 0}
                onChange={(v) => setTroop(t.id, v)}
              />
            ))}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!foundReadiness.canStartExpedition}
              onClick={confirmFound}
            >
              Şehir Kur Seferini Başlat
            </button>
            {!foundReadiness.canStartExpedition && (
              <p className="city-panel-form-hint city-panel-found-warn">
                {foundReadiness.colonistAvailable < FOUND_CITY_MIN_COLONISTS
                  ? `En az ${FOUND_CITY_MIN_COLONISTS} Kolonist seçin (boşta: ${foundReadiness.colonistAvailable}).`
                  : 'Toplam birlik ve kolonist şartlarını sağlayın.'}
              </p>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPanelMode(null)}>
              İptal
            </button>
          </div>
        )}

        {panelMode === 'spy' && canSpy && (
          <div className="city-panel-form">
            <h3 className="city-panel-form-title">Casusluk</h3>
            <p className="city-panel-form-hint city-panel-origin-hint">
              Çıkış şehri: <strong>{activeCityName}</strong> — casuslar bu şehirden düşer
            </p>
            <p className="city-panel-form-hint">
              Mevcut boşta casus: <strong>{idleSpies}</strong>
            </p>
            <ExpeditionEtaStrip durationSeconds={EXPEDITION_DURATIONS.spy} />
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
            <button type="button" className="btn btn-primary" disabled={!canStartSpy} onClick={confirmSpy}>
              Casus Gönder
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPanelMode(null)}>
              İptal
            </button>
          </div>
        )}

        {!panelMode && (
          <div className="popup-actions city-panel-actions">
            {outOfRange && (
              <p className="city-panel-range-warn">
                Bu şehir radar menziliniz dışında. Operasyonlar kullanılamaz.
              </p>
            )}
            {city.status !== 'own' && inRadarRange && (
              <button type="button" className="btn btn-danger" onClick={() => setPanelMode('attack')}>
                ⚔️ Asker Gönder
              </button>
            )}
            {canSpy && (
              <button type="button" className="btn btn-secondary" onClick={() => setPanelMode('spy')}>
                Casusluk
              </button>
            )}
            {city.status !== 'own' && !inRadarRange && (
              <>
                <button type="button" className="btn btn-danger" disabled title="Radar menzili dışı">
                  ⚔️ Asker Gönder
                </button>
                {(city.status === 'enemy' || city.status === 'bot') && (
                  <button type="button" className="btn btn-secondary" disabled title="Radar menzili dışı">
                    Casusluk
                  </button>
                )}
              </>
            )}
            {canFound && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!foundReadiness.canOpenPanel}
                title={foundButtonTitle}
                onClick={() => foundReadiness.canOpenPanel && setPanelMode('found')}
              >
                🏙️ Şehir Kur
              </button>
            )}
            {canFound && !foundReadiness.canOpenPanel && (
              <p className="city-panel-found-req">{foundButtonTitle}</p>
            )}
            {city.status === 'empty' && !canFound && outOfRange && (
              <button type="button" className="btn btn-primary" disabled title="Radar menzili dışı">
                🏙️ Şehir Kur
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
