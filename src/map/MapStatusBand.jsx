import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { buildOperationalTickerMessages, dedupeTickerMessages } from '../lib/mapStatusTicker';

export default function MapStatusBand() {
  const expeditions = useGameStore((s) => s.expeditions);
  const reports = useGameStore((s) => s.reports);
  const newsLog = useGameStore((s) => s.newsLog);
  const cities = useGameStore((s) => s.cities);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const globalOutbreak = useGameStore((s) => s.globalCbrnOutbreak);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);

  const messages = useMemo(
    () => buildOperationalTickerMessages({
      expeditions,
      reports,
      newsLog,
      cities,
      activeCityId,
      playerCities,
      activeCrisis,
      globalOutbreak,
      incomingAttacks,
    }),
    [
      expeditions,
      reports,
      newsLog,
      cities,
      activeCityId,
      playerCities,
      activeCrisis,
      globalOutbreak,
      incomingAttacks,
    ],
  );

  const unique = dedupeTickerMessages(messages);
  const shouldScroll = unique.length > 1;
  const track = shouldScroll ? [...unique, ...unique] : unique;

  return (
    <div
      className={['map-status-band', !shouldScroll && 'map-status-band--static'].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="map-status-band__viewport">
        <div className="map-status-band__track">
          {track.map((msg, idx) => (
            <span
              key={`${msg.id}-${idx}`}
              className={`map-status-band__item${String(msg.id ?? '').toLowerCase().includes('kbrn') || String(msg.id ?? '').toLowerCase().includes('outbreak') ? ' map-status-band__item--kbrn-alarm' : ''}`}
            >
              [ <strong>{msg.label}</strong> ] {msg.text}
              <span className="map-status-band__sep" aria-hidden="true"> · </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
