import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { buildOperationalTickerMessages } from '../lib/mapStatusTicker';
import CyberTerminalPlaceholder from './CyberTerminalPlaceholder';

const TYPE_LABEL = {
  info: 'SİSTEM',
  success: 'OPERASYON',
  warn: 'UYARI',
  intel: 'İSTİHBARAT',
  danger: 'ALARM',
};

function buildTickerItems(state) {
  const fromOps = buildOperationalTickerMessages(state).map((m) => ({
    id: m.id,
    tag: m.label,
    text: m.text,
  }));

  const items = [];

  for (const row of state.feedItems ?? []) {
    items.push({
      id: row.id,
      tag: TYPE_LABEL[row.type] ?? 'SİSTEM',
      text: row.message,
    });
  }

  for (const m of fromOps) {
    if (!items.some((i) => i.id === m.id)) items.push(m);
  }

  if (items.length === 0) {
    items.push({
      id: 'idle',
      tag: 'SİSTEM STABIL',
      text: 'Tüm üsler normal operasyon modunda',
    });
  }

  return items.slice(0, 24);
}

export default function CommandTickerFeed() {
  const feedItems = useNotificationStore((s) => s.feedItems);
  const newsLog = useGameStore((s) => s.newsLog);
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const globalOutbreak = useGameStore((s) => s.globalCbrnOutbreak);
  const expeditions = useGameStore((s) => s.expeditions);
  const reports = useGameStore((s) => s.reports);
  const cities = useGameStore((s) => s.cities);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);

  const items = useMemo(
    () => buildTickerItems({
      feedItems,
      newsLog,
      activeCrisis,
      globalOutbreak,
      expeditions,
      reports,
      cities,
      activeCityId,
      playerCities,
      incomingAttacks,
    }),
    [
      feedItems,
      newsLog,
      activeCrisis,
      globalOutbreak,
      expeditions,
      reports,
      cities,
      activeCityId,
      playerCities,
      incomingAttacks,
    ],
  );

  const track = [...items, ...items];
  const hasFeed = items.length > 0;

  return (
    <div className="command-ticker" role="marquee" aria-live="polite">
      <span className="command-ticker__label">C4ISR</span>
      <div className="command-ticker__viewport">
        {hasFeed ? (
          <div className="command-ticker__track">
            {track.map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="command-ticker__item">
                <span className="command-ticker__tag">[{item.tag}]</span>
                {item.text}
              </span>
            ))}
          </div>
        ) : (
          <CyberTerminalPlaceholder variant="scan" className="command-ticker__placeholder" />
        )}
      </div>
    </div>
  );
}
