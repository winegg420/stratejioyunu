/**
 * Harita alt bilgi bandı + global ticker — oyun durumuna göre dinamik mesajlar.
 */
import { translate } from '../i18n';

export function buildOperationalTickerMessages(state, lang = 'tr') {
  const t = (key, vars) => translate(lang, key, vars);
  const {
    expeditions = [],
    reports = [],
    newsLog = [],
    cities = {},
    activeCityId,
    playerCities = [],
    activeCrisis,
    globalOutbreak,
    incomingAttacks = [],
  } = state;

  const messages = [];
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const cityName = activeCity?.name ?? t('common.baseFallback');
  const outgoing = (expeditions ?? []).filter((e) => e.direction === 'outgoing');

  if (activeCrisis?.active) {
    messages.push({
      id: 'crisis',
      label: activeCrisis.admin ? t('map.ticker.crisisEmergency') : t('map.ticker.disaster'),
      text: `${activeCrisis.type ?? 'Kriz'}${activeCrisis.regionName ? ` — ${activeCrisis.regionName}` : ''}`,
    });
  }

  if (globalOutbreak?.active) {
    messages.push({
      id: 'cbrn',
      label: t('map.ticker.cbrn'),
      text: t('map.ticker.quarantine', {
        region: globalOutbreak.regionName ?? t('map.ticker.regionFallback'),
      }),
    });
  }

  if ((incomingAttacks ?? []).length > 0) {
    const atk = incomingAttacks[0];
    messages.push({
      id: 'incoming-atk',
      label: t('map.ticker.attack'),
      text: t('map.ticker.incoming', {
        origin: atk?.originCityName ?? t('common.enemyFallback'),
        target: atk?.targetCityName ?? cityName,
      }),
    });
  }

  for (const exp of outgoing.slice(-3)) {
    const type = (exp.type ?? 'Sefer').toLowerCase();
    const label = /saldır|attack/.test(type)
      ? t('map.ticker.expeditionAlarm')
      : /keşif|scout/.test(type)
        ? t('map.ticker.scout')
        : t('map.ticker.expedition');
    messages.push({
      id: `exp-out-${exp.id}`,
      label,
      text: t('map.ticker.movementDetected', {
        origin: exp.originCityName ?? cityName,
        target: exp.target ?? 'hedef',
      }),
    });
  }

  const returning = (expeditions ?? []).filter((e) => e.direction === 'returning');
  if (returning.length > 0) {
    const r = returning[returning.length - 1];
    messages.push({
      id: `exp-ret-${r.id}`,
      label: t('map.ticker.return'),
      text: t('map.ticker.convoyReturn', {
        from: r.target ?? 'Cephe',
        to: r.originCityName ?? cityName,
      }),
    });
  }

  let buildTotal = 0;
  let prodTotal = 0;
  for (const city of Object.values(cities ?? {})) {
    buildTotal += city?.constructionQueue?.length ?? 0;
    prodTotal += city?.productionQueue?.length ?? 0;
  }
  if (buildTotal > 0) {
    messages.push({
      id: 'build-q',
      label: t('map.ticker.construction'),
      text: t('map.ticker.constructionQueue', { count: buildTotal }),
    });
  }
  if (prodTotal > 0) {
    messages.push({
      id: 'prod-q',
      label: t('map.ticker.production'),
      text: t('map.ticker.prodProcessing', { count: prodTotal }),
    });
  }

  const unread = (reports ?? []).filter((r) => r.isNew).length;
  if (unread > 0) {
    messages.push({
      id: 'reports',
      label: t('map.ticker.report'),
      text: t('map.ticker.unreadIntel', { count: unread }),
    });
  }

  for (const entry of (newsLog ?? []).slice(0, 4)) {
    const text = entry.text ?? entry.title;
    if (!text) continue;
    messages.push({
      id: entry.id ?? `news-${messages.length}`,
      label: t('map.ticker.news'),
      text: String(text),
    });
  }

  if (outgoing.length === 0 && !incomingAttacks?.length && !activeCrisis?.active && messages.length > 0) {
    messages.push({
      id: 'stable-quiet',
      label: t('map.ticker.status'),
      text: t('map.ticker.stableQuiet', { city: cityName }),
    });
  }

  return messages.slice(0, 14);
}

/** Marquee için benzersiz mesaj listesi */
export function dedupeTickerMessages(messages) {
  const seen = new Set();
  return (messages ?? []).filter((m) => {
    const key = m?.id ?? `${m?.label}-${m?.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
