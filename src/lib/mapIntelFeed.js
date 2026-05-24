import { filterActiveExpeditions } from './gameUtils';

/** Harita sağ panel — haber etiketi sınıfları */
export const INTEL_FEED_TAG_CLASS = {
  SALDIRI: 'map-intel-feed__tag--attack',
  KEŞİF: 'map-intel-feed__tag--scout',
  SAVUNMA: 'map-intel-feed__tag--defense',
  SABOTAJ: 'map-intel-feed__tag--sabotage',
  SİBER: 'map-intel-feed__tag--cyber',
  HABER: 'map-intel-feed__tag--news',
  SEFER: 'map-intel-feed__tag--expedition',
  RAPOR: 'map-intel-feed__tag--report',
  RADAR: 'map-intel-feed__tag--radar',
  İSTİHBARAT: 'map-intel-feed__tag--intel',
  CEPHE: 'map-intel-feed__tag--front',
  SONDA: 'map-intel-feed__tag--scout',
};

export function getIntelFeedTagClass(tag) {
  return INTEL_FEED_TAG_CLASS[tag] ?? 'map-intel-feed__tag--default';
}

function textBlob(...parts) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function resolveNewsFeedTag(entry) {
  const blob = textBlob(entry?.type, entry?.text, entry?.title, entry?.logText);
  if (/sabotaj|sabotage/.test(blob)) return 'SABOTAJ';
  if (/siber|cyber|hack/.test(blob)) return 'SİBER';
  if (/saldır|attack|baskın|invasion/.test(blob)) return 'SALDIRI';
  if (/savunma|defense|kalkan|koruma/.test(blob)) return 'SAVUNMA';
  if (/keşif|scout|recon|radar/.test(blob)) return 'KEŞİF';
  return 'HABER';
}

export function resolveExpeditionFeedTag(exp) {
  const blob = textBlob(exp?.type, exp?.mission, exp?.target);
  if (/saldır|attack|baskın|assault/.test(blob)) return 'SALDIRI';
  if (/keşif|scout|recon/.test(blob)) return 'KEŞİF';
  if (/sabotaj|sabotage/.test(blob)) return 'SABOTAJ';
  if (/siber|cyber/.test(blob)) return 'SİBER';
  if (/savunma|defense|takviye|reinforce/.test(blob)) return 'SAVUNMA';
  return 'SEFER';
}

/** Casusluk sondası / keşif raporları — harita istihbarat paneli. */
export function isSpyProbeReport(report) {
  if (!report || report.isPlaceholder) return false;
  if (report.mode === 'spy' || report.expeditionMode === 'spy') return true;
  const blob = textBlob(report.type, report.title, report.preview, report.filterType);
  if (/ajan operasyonu/i.test(blob)) return false;
  if (report.filterType === 'spy') return true;
  return /casusluk sondası|casusluk sondasi|casusluk|sonda|keşif|scout|recon/i.test(blob);
}

export function buildSpyProbeFeedItems(reports, limit = 10) {
  return (reports ?? [])
    .filter(isSpyProbeReport)
    .slice(0, limit)
    .map((rep) => {
      const tag = resolveReportFeedTag(rep);
      const target = rep.targetCity ? ` · ${rep.targetCity}` : '';
      return {
        id: `spy-probe-${rep.id}`,
        text: `${rep.title ?? rep.type ?? 'Casusluk Sondası'}${target}`,
        detail: rep.preview ?? null,
        tag: tag === 'KEŞİF' ? 'SONDA' : tag,
        tagClass: getIntelFeedTagClass(tag === 'KEŞİF' ? 'SONDA' : tag),
        endsAt: null,
        priority: -1,
      };
    });
}

export function resolveReportFeedTag(report) {
  const ft = report?.filterType;
  const blob = textBlob(report?.type, report?.title, report?.preview);

  if (ft === 'cyber' || /siber|cyber|hack/.test(blob)) return 'SİBER';
  if (ft === 'spy') {
    if (/sabotaj|sabotage/.test(blob)) return 'SABOTAJ';
    return 'KEŞİF';
  }
  if (ft === 'battle') {
    if (/savunma|defense|savun|defend/.test(blob)) return 'SAVUNMA';
    return 'SALDIRI';
  }
  if (/sabotaj|sabotage/.test(blob)) return 'SABOTAJ';
  if (/keşif|scout/.test(blob)) return 'KEŞİF';
  if (/savunma|defense/.test(blob)) return 'SAVUNMA';
  if (/saldır|attack/.test(blob)) return 'SALDIRI';
  return 'RAPOR';
}

export function formatExpeditionIntelText(exp) {
  const origin = exp.originCityName ?? 'Üs';
  const target = exp.target ?? 'Hedef';
  const typeLabel = exp.type ?? exp.mode ?? 'Sefer';

  if (exp.direction === 'returning' || exp.recalled) {
    return `${target} → ${origin}: ${typeLabel}`;
  }
  return `${origin} → ${target}: ${typeLabel}`;
}

export function buildMapIntelFeed({
  newsLog,
  expeditions,
  reports,
  labels = {},
  now = Date.now(),
}) {
  const etaLabel = labels.etaRemaining ?? '{{time}} kaldı';
  const etaDoneLabel = labels.etaArriving ?? 'Varışta';
  const items = [];

  const activeExps = filterActiveExpeditions(expeditions, now)
    .sort((a, b) => {
      const aEnd = a.endsAt ?? Number.MAX_SAFE_INTEGER;
      const bEnd = b.endsAt ?? Number.MAX_SAFE_INTEGER;
      if (aEnd !== bEnd) return aEnd - bEnd;
      return String(b.id).localeCompare(String(a.id));
    });

  for (const exp of activeExps) {
    const tag = resolveExpeditionFeedTag(exp);
    items.push({
      id: `exp-${exp.id}`,
      text: formatExpeditionIntelText(exp),
      tag,
      tagClass: getIntelFeedTagClass(tag),
      endsAt: exp.endsAt ?? null,
      etaLabel,
      etaDoneLabel,
      priority: 0,
    });
  }

  for (const entry of (newsLog ?? []).slice(0, 6)) {
    const text = entry.text ?? entry.title ?? entry.logText;
    if (!text) continue;
    const tag = resolveNewsFeedTag(entry);
    items.push({
      id: entry.id ?? `news-${items.length}`,
      text: String(text),
      tag,
      tagClass: getIntelFeedTagClass(tag),
      endsAt: null,
      priority: 1,
    });
  }

  for (const rep of (reports ?? []).filter((r) => !r.isPlaceholder && !isSpyProbeReport(r)).slice(0, 6)) {
    if (!rep.title && !rep.preview) continue;
    const tag = resolveReportFeedTag(rep);
    items.push({
      id: `rep-${rep.id ?? items.length}`,
      text: rep.title ?? rep.preview,
      tag,
      tagClass: getIntelFeedTagClass(tag),
      endsAt: null,
      priority: 2,
    });
  }

  return items
    .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))
    .slice(0, 16);
}
