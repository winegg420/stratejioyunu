import { useEffect, useMemo, useState } from 'react';
import { useActionLock } from '../hooks/useActionLock';
import { isCityInOperationRange } from '../lib/mapRange';
import { bypassWarLocksForDevTest } from '../lib/devTestMode';
import {
  calcExpeditionTravelSeconds,
  isAirOnlyExpedition,
  resolveCityCoords,
} from '../lib/expeditionTravel';
import { getTroopStock } from '../lib/troopStock';
import ExpeditionEtaStrip from './ExpeditionEtaStrip';
import CustomDropdown from './CustomDropdown';
import TroopStockLabel from './TroopStockLabel';
import {
  STORE_EMPTY_ARRAY,
  useActiveCityIdleTroops,
  useGameStore,
  useTroopsAwayMap,
} from '../stores/gameStore';
import { CARGO_RESOURCE_ID } from '../lib/cargoLogistics';
import { getResourceDisplay } from '../data/resourceCatalog';

function TroopLaunchRow({ troop, value, onChange, awayMap }) {
  const stock = getTroopStock(troop, awayMap);
  const idleCap = stock.idle;
  const qty = Math.min(idleCap, Math.max(0, Number(value) || 0));

  return (
    <div className="expedition-troop-row">
      <div className="expedition-troop-row__meta">
        <span className="expedition-troop-row__icon" aria-hidden="true">
          {troop.icon}
        </span>
        <div>
          <span className="expedition-troop-row__name">{troop.name}</span>
          <TroopStockLabel troop={troop} awayMap={awayMap} className="expedition-troop-row__stock" />
        </div>
      </div>
      <div className="expedition-troop-row__controls">
        <input
          type="range"
          className="expedition-troop-slider"
          min={0}
          max={idleCap}
          value={qty}
          disabled={idleCap < 1}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="input-qty expedition-input-qty"
          min={0}
          max={idleCap}
          value={qty}
          disabled={idleCap < 1}
          onChange={(e) => onChange(Math.min(idleCap, Math.max(0, Number(e.target.value) || 0)))}
        />
        <button
          type="button"
          className="btn btn-hud-secondary btn-sm expedition-troop-max"
          disabled={idleCap < 1}
          onClick={() => onChange(idleCap)}
        >
          MAX
        </button>
      </div>
    </div>
  );
}

export default function NewExpeditionModal({ open, onClose }) {
  const [targetName, setTargetName] = useState('');
  const [troopQty, setTroopQty] = useState({});
  const [cargoHammadde, setCargoHammadde] = useState(0);

  const activeCityId = useGameStore((s) => s.activeCityId);
  const resources = useGameStore(
    (s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY,
  );
  const hammaddeStock = resources.find((r) => r.id === CARGO_RESOURCE_ID)?.current ?? 0;
  const activeCityName = useGameStore(
    (s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name ?? '',
  );
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  const idleTroops = useActiveCityIdleTroops();
  const awayMap = useTroopsAwayMap(activeCityId);
  const startExpedition = useGameStore((s) => s.startExpedition);
  const { locked: actionLocked, runLocked } = useActionLock();

  const combatTroops = useMemo(
    () => idleTroops.filter((t) => t.id !== 'colonist'),
    [idleTroops],
  );

  const devWarBypass = bypassWarLocksForDevTest();

  const targets = useMemo(
    () => mapCities.filter((c) => {
      if (c.status === 'own' || c.status === 'empty') return false;
      if (devWarBypass) return c.status !== 'own' && c.status !== 'empty';
      return isCityInOperationRange(c, activeCityId, playerCities, mapCities);
    }),
    [mapCities, activeCityId, playerCities, devWarBypass],
  );

  const targetCity = useMemo(
    () => mapCities.find((c) => c.name === targetName) ?? null,
    [mapCities, targetName],
  );

  const originCoords = useMemo(
    () => resolveCityCoords(activeCityName, playerCities, mapCities),
    [activeCityName, playerCities, mapCities],
  );

  const durationSeconds = useMemo(() => {
    if (!targetCity) return 0;
    return calcExpeditionTravelSeconds({
      origin: originCoords,
      target: { lat: targetCity.lat, lng: targetCity.lng },
      troopQty,
      mapCities,
      mode: 'attack',
    });
  }, [originCoords, targetCity, troopQty, mapCities]);

  const attackTotal = Object.values(troopQty).reduce((a, b) => a + (Number(b) || 0), 0);
  const canStart = Boolean(
    targetCity
    && (attackTotal >= 1 || cargoHammadde >= 1)
    && combatTroops.every((t) => (Number(troopQty[t.id]) || 0) <= t.available)
    && cargoHammadde <= hammaddeStock,
  );
  const airRush = isAirOnlyExpedition(troopQty);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTargetName('');
      setTroopQty({});
      setCargoHammadde(0);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!canStart || actionLocked || !targetCity) return;
    runLocked(() => {
      const ok = startExpedition({
        targetCity,
        troopQty,
        mode: 'attack',
        cargoHammadde: cargoHammadde > 0 ? cargoHammadde : 0,
      });
      if (ok) onClose();
    });
  };

  return (
    <div className="expedition-launch-modal-root" role="presentation">
      <button
        type="button"
        className="expedition-launch-modal__backdrop"
        onClick={onClose}
        aria-label="Modalı kapat"
      />
      <div
        className="expedition-launch-modal hud-panel-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expedition-launch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="expedition-launch-modal__head">
          <div>
            <p className="expedition-launch-modal__eyebrow">[ SEFER KOMUTASI ]</p>
            <h2 id="expedition-launch-title">Yeni Sefere Çık</h2>
            <p className="expedition-launch-modal__hint">
              Çıkış: <strong>{activeCityName || '—'}</strong>
              {devWarBypass
                ? ' · Geliştirici modu: tüm düşman/bot hedefleri'
                : ' · Radar menzili içindeki hedefler'}
            </p>
          </div>
          <button
            type="button"
            className="hud-modal-close expedition-launch-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            [ X ]
          </button>
        </header>

        <div className="expedition-launch-modal__body">
          <label className="expedition-launch-field">
            <span>Hedef şehir</span>
            <CustomDropdown
              className="expedition-launch-select"
              value={targetName}
              onChange={setTargetName}
              placeholder="Seçin…"
              aria-label="Hedef şehir"
              options={[
                { value: '', label: 'Seçin…', disabled: true },
                ...targets.map((c) => ({
                  value: c.name,
                  label: `${c.name} (${c.status})`,
                })),
              ]}
            />
          </label>

          {!targets.length && (
            <p className="expedition-launch-warn" role="status">
              Radar menzili içinde saldırılabilir hedef yok. Haritadan uzaklığı kontrol edin.
            </p>
          )}

          {targetCity && (
            <ExpeditionEtaStrip durationSeconds={durationSeconds} airRush={airRush} />
          )}

          <label className="expedition-launch-field expedition-cargo-field">
            <span>
              Kargo Ekle ({getResourceDisplay(CARGO_RESOURCE_ID).label})
            </span>
            <p className="expedition-launch-cargo-hint">
              Sadece transfer — yolda saldırı mekaniği yok; dönüşte üsse teslim edilir.
            </p>
            <div className="expedition-cargo-controls">
              <input
                type="range"
                min={0}
                max={hammaddeStock}
                value={cargoHammadde}
                onChange={(e) => setCargoHammadde(Number(e.target.value))}
              />
              <input
                type="number"
                className="input-qty"
                min={0}
                max={hammaddeStock}
                value={cargoHammadde}
                onChange={(e) => setCargoHammadde(
                  Math.min(hammaddeStock, Math.max(0, Number(e.target.value) || 0)),
                )}
              />
              <span className="font-hud-data">
                / {hammaddeStock.toLocaleString('tr-TR')}
              </span>
            </div>
          </label>

          <div className="expedition-troop-list">
            {combatTroops.map((t) => (
              <TroopLaunchRow
                key={t.id}
                troop={t}
                awayMap={awayMap}
                value={troopQty[t.id] ?? 0}
                onChange={(v) => setTroopQty((prev) => ({ ...prev, [t.id]: v }))}
              />
            ))}
          </div>
        </div>

        <footer className="expedition-launch-modal__foot">
          <button
            type="button"
            className="btn btn-hud-primary expedition-launch-submit"
            disabled={!canStart || actionLocked}
            onClick={handleSubmit}
          >
            [ SEFERİ BAŞLAT ]
          </button>
          <button type="button" className="btn btn-hud-secondary btn-sm" onClick={onClose}>
            İptal
          </button>
        </footer>
      </div>
    </div>
  );
}
