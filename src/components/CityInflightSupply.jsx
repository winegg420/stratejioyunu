import { useMemo } from 'react';
import { remainingFromEndsAt } from '../lib/gameUtils';
import { formatCargoAmount } from '../lib/cargoLogistics';
import { useGameStore } from '../stores/gameStore';

function formatEtaShort(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getCargoQty(exp) {
  return Math.max(0, Math.floor(exp.tradePayload?.resources?.hammadde ?? exp.cargoAmount ?? 0));
}

export default function CityInflightSupply({ cityId, cityName, className = '' }) {
  const now = useGameStore((s) => s.now);
  const expeditions = useGameStore((s) => s.expeditions ?? []);

  const transits = useMemo(
    () => expeditions.filter(
      (e) => e.mode === 'cargo'
        && e.direction === 'outgoing'
        && (e.originCityId === cityId
          || e.targetCityId === cityId
          || e.originCityName === cityName
          || e.target === cityName),
    ),
    [expeditions, cityId, cityName],
  );

  if (transits.length === 0) return null;

  return (
    <section
      className={['city-inflight-supply', className].filter(Boolean).join(' ')}
      aria-label="Yoldaki ikmal"
    >
      <h3 className="map-command-modal__section-title">Yoldaki İkmal</h3>
      <ul className="city-inflight-supply__list">
        {transits.map((exp) => {
          const rem = remainingFromEndsAt(exp.endsAt, now);
          const qty = getCargoQty(exp);
          const incoming = exp.targetCityId === cityId || exp.target === cityName;
          return (
            <li key={exp.id} className="city-inflight-supply__item font-hud-data">
              <span className="city-inflight-supply__label">
                Yoldaki İkmal: {formatCargoAmount(qty)}
              </span>
              <span className="city-inflight-supply__eta">({formatEtaShort(rem)})</span>
              <span className="city-inflight-supply__dir">
                {incoming
                  ? `← ${exp.originCityName ?? '—'}`
                  : `→ ${exp.target ?? '—'}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
