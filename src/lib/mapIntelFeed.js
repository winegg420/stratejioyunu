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

export function buildMapIntelFeed({ newsLog, expeditions, reports }) {
  const items = [];

  for (const entry of newsLog ?? []) {
    const text = entry.text ?? entry.title ?? entry.logText;
    if (!text) continue;
    const tag = resolveNewsFeedTag(entry);
    items.push({
      id: entry.id ?? `news-${items.length}`,
      text: String(text),
      tag,
      tagClass: getIntelFeedTagClass(tag),
    });
  }

  for (const exp of (expeditions ?? []).filter((e) => e.direction === 'outgoing').slice(-6).reverse()) {
    const tag = resolveExpeditionFeedTag(exp);
    items.push({
      id: `exp-${exp.id}`,
      text: `${exp.originCityName ?? 'Üs'} → ${exp.target}: ${exp.type ?? 'Sefer'}`,
      tag,
      tagClass: getIntelFeedTagClass(tag),
    });
  }

  for (const rep of (reports ?? []).slice(0, 6)) {
    if (!rep.title && !rep.preview) continue;
    const tag = resolveReportFeedTag(rep);
    items.push({
      id: `rep-${rep.id ?? items.length}`,
      text: rep.title ?? rep.preview,
      tag,
      tagClass: getIntelFeedTagClass(tag),
    });
  }

  return items.slice(0, 10);
}
