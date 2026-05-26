import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { buildOperationalTickerMessages, dedupeTickerMessages } from '../lib/mapStatusTicker';
import { mergeTickerWithPool } from '../lib/c4isrMessagePool';
import { isCriticalTickerItem } from '../lib/tickerAlertLevel';
import CyberTerminalPlaceholder from './CyberTerminalPlaceholder';
import { useLanguage } from '../context/LanguageContext';
import { useUnderAttack } from '../stores/gameStore';

const TYPE_LABEL_KEYS = {
  info: 'terminal.tags.system',
  success: 'terminal.tags.operation',
  warn: 'terminal.tags.warn',
  intel: 'terminal.tags.intel',
  danger: 'terminal.tags.danger',
};

function buildTickerItems(state, lang, t) {
  const fromOps = buildOperationalTickerMessages(state, lang).map((m) => ({
    id: m.id,
    tag: m.label,
    text: m.text,
  }));

  const items = [];

  for (const row of state.feedItems ?? []) {
    const key = TYPE_LABEL_KEYS[row.type] ?? 'terminal.tags.system';
    items.push({
      id: row.id,
      tag: t(key),
      text: row.message,
      critical: row.type === 'danger' || row.type === 'warn',
    });
  }

  for (const m of fromOps) {
    if (!items.some((i) => i.id === m.id)) items.push(m);
  }

  const dynamic = dedupeTickerMessages(items);
  return mergeTickerWithPool(dynamic, t, 10).slice(0, 24);
}

export default function CommandTickerFeed() {
  const { lang, t } = useLanguage();
  const underAttack = useUnderAttack();
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
  const now = useGameStore((s) => s.now);

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
      now,
    }, lang, t),
    [
      lang,
      t,
      feedItems,
      newsLog,
      activeCrisis,
      globalOutbreak,
      expeditions,
      reports,
      cities,
      activeCityId,
      playerCities,
      now,
      incomingAttacks,
    ],
  );

  const unique = dedupeTickerMessages(items);
  const shouldScroll = unique.length > 1;
  const track = shouldScroll ? [...unique, ...unique] : unique;
  const hasFeed = unique.length > 0;
  const scrollDurationSec = Math.min(
    150,
    Math.max(58, unique.length * 8),
  );

  return (
    <div
      className={['command-ticker', !shouldScroll && 'command-ticker--static'].filter(Boolean).join(' ')}
      role="marquee"
      aria-live="polite"
    >
      <span className="command-ticker__label">{t('terminal.label')}</span>
      <div className="command-ticker__ad-slot" aria-hidden="true" data-ad-slot="bottom-ticker" />
      <div className="command-ticker__viewport">
        {hasFeed ? (
          <div
            className="command-ticker__track"
            style={{ '--command-ticker-duration': `${scrollDurationSec}s` }}
          >
            {track.map((item, idx) => {
              const critical = item.critical || isCriticalTickerItem(item)
                || (underAttack && String(item.id).startsWith('exp-out-'));
              return (
              <span
                key={`${item.id}-${idx}`}
                className={[
                  'command-ticker__item',
                  critical && 'command-ticker__item--critical',
                  critical && 'command-ticker__item--kbrn-alarm',
                ].filter(Boolean).join(' ')}
              >
                <span className="command-ticker__tag">[{item.tag}]</span>
                {item.text}
              </span>
            );
            })}
          </div>
        ) : (
          <CyberTerminalPlaceholder variant="scan" className="command-ticker__placeholder" />
        )}
      </div>
    </div>
  );
}
