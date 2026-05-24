import { useMemo, useState } from 'react';
import { useActionLock } from '../hooks/useActionLock';
import { remainingFromEndsAt, formatSeconds } from '../lib/gameUtils';
import {
  CARGO_RESOURCE_ID,
  LOGISTICS_MODE,
  calcAirLogisticsCost,
  calcCargoTransferDuration,
  canUseAirLogistics,
  formatCargoAmount,
  formatCargoLogisticsLabel,
} from '../lib/cargoLogistics';
import { canAffordEmpireMoney, getEmpireMoneyTotal } from '../lib/empireTreasury';
import { resolveCityCoords } from '../lib/expeditionTravel';
import { calcTradeDepotOverflow } from '../lib/tradeUtils';
import { useGameStore } from '../stores/gameStore';

function formatEtaShort(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function CargoLogisticsPanel({
  originCityId,
  originCityName,
  targetCityId,
  targetCityName,
}) {
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState(LOGISTICS_MODE.ROAD);

  const cities = useGameStore((s) => s.cities);
  const playerCities = useGameStore((s) => s.playerCities);
  const mapCities = useGameStore((s) => s.mapCities);
  const now = useGameStore((s) => s.now);
  const expeditions = useGameStore((s) => s.expeditions);
  const cargoTransfers = useMemo(
    () => expeditions.filter((e) => e.mode === 'cargo' && e.direction === 'outgoing'),
    [expeditions],
  );
  const startCargoTransfer = useGameStore((s) => s.startCargoTransfer);
  const { locked: actionLocked, runLocked } = useActionLock();

  const originCity = cities[originCityId];
  const targetCity = cities[targetCityId];
  const hammaddeStock = originCity?.resources?.find((r) => r.id === CARGO_RESOURCE_ID)?.current ?? 0;

  const originCoords = useMemo(
    () => resolveCityCoords(originCityName, playerCities, mapCities),
    [originCityName, playerCities, mapCities],
  );
  const targetCoords = useMemo(
    () => resolveCityCoords(targetCityName, playerCities, mapCities),
    [targetCityName, playerCities, mapCities],
  );

  const roadTiming = useMemo(
    () => calcCargoTransferDuration({ originCoords, targetCoords, mode: LOGISTICS_MODE.ROAD }),
    [originCoords, targetCoords],
  );
  const airTiming = useMemo(
    () => calcCargoTransferDuration({ originCoords, targetCoords, mode: LOGISTICS_MODE.AIR }),
    [originCoords, targetCoords],
  );
  const timing = mode === LOGISTICS_MODE.AIR ? airTiming : roadTiming;

  const airUnlocked = canUseAirLogistics(originCity, targetCity);
  const airCost = timing.distanceKm != null ? calcAirLogisticsCost(timing.distanceKm) : 0;
  const empireMoney = getEmpireMoneyTotal(cities);
  const canAffordAir = canAffordEmpireMoney(cities, airCost);

  const qty = Math.min(hammaddeStock, Math.max(0, Math.floor(amount)));
  const overflow = useMemo(() => {
    if (!targetCity || qty <= 0) return [];
    return calcTradeDepotOverflow(targetCity.resources, { [CARGO_RESOURCE_ID]: qty });
  }, [targetCity, qty]);

  const etaSeconds = mode === LOGISTICS_MODE.AIR ? airTiming.seconds : roadTiming.roadSeconds ?? roadTiming.seconds;
  const distanceLabel = timing.distanceKm != null
    ? (timing.distanceKm >= 1 ? `${Math.round(timing.distanceKm)} km` : `${Math.round(timing.distanceKm * 1000)} m`)
    : '—';

  const canSubmit = qty >= 1
    && overflow.length === 0
    && (mode !== LOGISTICS_MODE.AIR || (airUnlocked && canAffordAir));

  const handleSubmit = () => {
    if (!canSubmit || actionLocked) return;
    runLocked(() => {
      const ok = startCargoTransfer({
        targetCityId,
        amount: qty,
        logisticsMode: mode,
      });
      if (ok) {
        setAmount(0);
      }
    });
  };

  return (
    <section className="cargo-logistics-panel" aria-label="Hammadde transfer lojistiği">
      <h3 className="map-command-modal__section-title">Hammadde Gönder</h3>
      <p className="map-command-modal__hint">
        Gönderen: <strong>{originCityName}</strong> → Hedef: <strong>{targetCityName}</strong>
        {' · '}Depoda: <strong>{hammaddeStock.toLocaleString('tr-TR')}</strong>
      </p>
      <p className="map-command-modal__hint map-command-modal__hint--treasury">
        Ortak dijital bütçe (userBalance): <strong>{empireMoney.toLocaleString('tr-TR')}</strong> bütçe
      </p>

      <div className="cargo-logistics-eta-strip" role="status" aria-live="polite">
        Mesafe: <strong>{distanceLabel}</strong>
        {' · '}Varış süresi: <strong>~{formatSeconds(etaSeconds)}</strong>
        {' '}({formatEtaShort(etaSeconds)})
        {mode === LOGISTICS_MODE.AIR && airUnlocked && (
          <> · Havayolu ücreti: <strong>{airCost.toLocaleString('tr-TR')} B</strong></>
        )}
      </div>

      <label className="cargo-logistics-field">
        <span>Miktar (hammadde)</span>
        <div className="cargo-logistics-qty-row">
          <input
            type="number"
            className="input-qty"
            min={0}
            max={hammaddeStock}
            value={qty}
            onChange={(e) => setAmount(Math.min(hammaddeStock, Math.max(0, Number(e.target.value) || 0)))}
          />
          <button
            type="button"
            className="btn btn-hud-secondary btn-sm"
            disabled={hammaddeStock < 1}
            onClick={() => setAmount(Math.floor(hammaddeStock / 2))}
          >
            %50
          </button>
          <button
            type="button"
            className="btn btn-hud-secondary btn-sm"
            disabled={hammaddeStock < 1}
            onClick={() => setAmount(hammaddeStock)}
          >
            MAX
          </button>
        </div>
      </label>

      <div className="cargo-logistics-mode-grid" role="group" aria-label="Taşıma modu">
        <button
          type="button"
          className={[
            'cargo-logistics-cyber-btn',
            mode === LOGISTICS_MODE.ROAD && 'cargo-logistics-cyber-btn--active',
          ].filter(Boolean).join(' ')}
          onClick={() => setMode(LOGISTICS_MODE.ROAD)}
        >
          <span className="cargo-logistics-cyber-btn__icon" aria-hidden="true">🚛</span>
          <span className="cargo-logistics-cyber-btn__label">KARAYOLU</span>
          <span className="cargo-logistics-cyber-btn__meta">
            0 Bütçe · ~{formatSeconds(roadTiming.roadSeconds ?? roadTiming.seconds)}
          </span>
        </button>

        <button
          type="button"
          className={[
            'cargo-logistics-cyber-btn',
            mode === LOGISTICS_MODE.AIR && 'cargo-logistics-cyber-btn--active',
            !airUnlocked && 'cargo-logistics-cyber-btn--locked',
          ].filter(Boolean).join(' ')}
          disabled={!airUnlocked}
          onClick={() => setMode(LOGISTICS_MODE.AIR)}
        >
          <span className="cargo-logistics-cyber-btn__icon" aria-hidden="true">✈️</span>
          <span className="cargo-logistics-cyber-btn__label">HAVAYOLU</span>
          <span className="cargo-logistics-cyber-btn__meta">
            {airUnlocked
              ? `${airCost.toLocaleString('tr-TR')} B · ~${formatSeconds(airTiming.seconds)}`
              : 'KİLİTLİ · Hava Üssü Sv.1+'}
          </span>
        </button>
      </div>

      {!airUnlocked && (
        <p className="cargo-logistics-air-warn">
          Her iki şehirde de Hava Üssü inşa edilmiş olmalıdır (her iki şehirde Sv.1+).
        </p>
      )}
      {mode === LOGISTICS_MODE.AIR && airUnlocked && !canAffordAir && (
        <p className="cargo-logistics-air-warn">Ortak bütçede yeterli nakit yok.</p>
      )}

      {overflow.length > 0 && (
        <p className="city-panel-found-warn">Hedef depo dolu — miktarı azaltın.</p>
      )}

      <button
        type="button"
        className="btn btn-hud-primary cargo-logistics-submit"
        disabled={!canSubmit || actionLocked}
        onClick={handleSubmit}
      >
        [ SEVKİYAT BAŞLAT ] · ~{formatEtaShort(etaSeconds)}
      </button>

      {cargoTransfers.length > 0 && (
        <div className="cargo-logistics-inflight">
          <h4>Yoldaki sevkiyatlar</h4>
          <ul>
            {cargoTransfers.map((exp) => {
              const rem = remainingFromEndsAt(exp.endsAt, now);
              return (
                <li key={exp.id}>
                  {exp.originCityName} → {exp.target}
                  {' · '}{formatCargoAmount(exp.cargoAmount ?? getCargoAmountFromExp(exp))}
                  {' · '}{formatCargoLogisticsLabel(exp.logisticsMode)}
                  {rem > 0 && ` · (${formatEtaShort(rem)})`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function getCargoAmountFromExp(exp) {
  return Math.max(0, Math.floor(exp.tradePayload?.resources?.hammadde ?? exp.cargoAmount ?? 0));
}
