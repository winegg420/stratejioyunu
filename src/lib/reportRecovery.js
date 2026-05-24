import { mergeReportLists } from './supabaseSync';

/** Geçmiş sefer kaydından rapor sekmesi için özet rapor üretir. */
export function pastExpeditionToReport(entry) {
  if (!entry?.id) return null;
  const resultText = String(entry.result ?? '').trim();
  const won = /zafer|win/i.test(resultText);
  const mode = entry.mode ?? '';
  const typeLower = String(entry.type ?? '').toLowerCase();

  let filterType = 'battle';
  let type = entry.type ?? 'Savaş';
  if (mode === 'spy' || typeLower.includes('casus')) {
    filterType = 'spy';
    type = 'Casusluk Sondası';
  } else if (mode === 'trade' || mode === 'cargo') {
    filterType = 'logistics';
    type = mode === 'cargo' ? 'Lojistik Sevkiyat' : 'Ticaret Konvoyu';
  }

  return {
    id: `past-${entry.id}`,
    filterType,
    type,
    title: `${entry.target} — ${resultText || 'Sefer tamamlandı'}`,
    preview: entry.loot && entry.loot !== '—' ? entry.loot : (resultText || 'Tamamlandı'),
    date: entry.date ?? '',
    targetCity: entry.target,
    winner: won ? 'player' : (resultText ? 'enemy' : null),
    isNew: false,
    reportCategory: 'expedition',
  };
}

/** Yerel rapor listesini geçmiş seferlerle tamamlar (eksik arşiv kurtarma). */
export function recoverReportsFromHistory({ reports = [], pastExpeditions = [] } = {}) {
  const synthesized = (pastExpeditions ?? [])
    .map(pastExpeditionToReport)
    .filter(Boolean);
  if (!synthesized.length) return reports ?? [];

  const withoutDupes = synthesized.filter((candidate) => {
    const hasSameId = (reports ?? []).some((r) => r.id === candidate.id);
    if (hasSameId) return false;
    return !(reports ?? []).some(
      (r) => r.targetCity === candidate.targetCity
        && r.title === candidate.title
        && r.date === candidate.date,
    );
  });

  return mergeReportLists(reports, withoutDupes);
}
