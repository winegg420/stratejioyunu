import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import {
  formatAiCenterStatus,
  getEarlyWarningIncomingAttacks,
} from '../lib/aiCenterEngine';

export default function AiRadarPanel() {
  const now = useGameStore((s) => s.now);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const playerCities = useGameStore((s) => s.playerCities);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);
  const intelFeed = useGameStore((s) => s.intelFeed ?? []);

  const cityIds = useMemo(() => playerCities.map((c) => c.id), [playerCities]);
  const warnings = useMemo(
    () => getEarlyWarningIncomingAttacks(incomingAttacks, cityIds, city, now),
    [incomingAttacks, cityIds, city, now],
  );

  const hasYzRadar = warnings.length > 0;
  const hasIntel = intelFeed.length > 0;
  if (!city || (!hasYzRadar && !hasIntel)) return null;

  const status = formatAiCenterStatus(city);

  return (
    <section className="panel ai-radar-panel" role="status">
      <h3 className="panel-title">
        <span className="panel-title__icon">📡</span>
        Komuta Radarı
      </h3>
      {hasYzRadar && <p className="hint ai-radar-panel__status">{status}</p>}

      {hasIntel && (
        <>
          <h4 className="ai-radar-panel__sub">İstihbarat Ağı</h4>
          <ul className="ai-radar-list ai-radar-list--intel">
            {intelFeed.slice(0, 6).map((item) => (
              <li key={item.id} className="ai-radar-list__item ai-radar-list__item--intel">
                {item.text}
              </li>
            ))}
          </ul>
        </>
      )}

      {hasYzRadar && (
        <>
          <h4 className="ai-radar-panel__sub">YZ Erken Uyarı</h4>
          <ul className="ai-radar-list">
            {warnings.map((atk) => {
              const target = playerCities.find((c) => c.id === atk.targetCityId);
              const remaining = remainingFromEndsAt(atk.endsAt, now);
              return (
                <li key={atk.id} className="ai-radar-list__item">
                  <strong>{target?.name ?? atk.targetCityId}</strong>
                  <span> — düşman seferi ETA {formatSeconds(remaining)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
