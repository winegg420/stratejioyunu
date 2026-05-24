import { landUnits } from '../data/placeholder';
import { LEGACY_UNIT_NAME_TO_ID } from '../data/unitCatalog';
import { stripBotCitySuffix } from './botProvinceAssignment';

const NAME_TO_ID = {
  ...LEGACY_UNIT_NAME_TO_ID,
  ...Object.fromEntries(landUnits.map((u) => [u.name.toLowerCase(), u.id])),
};

export function normalizeMapCityKey(name) {
  return stripBotCitySuffix(String(name ?? '')).trim().toLowerCase();
}

export function extractCityFromReportTitle(title) {
  if (!title) return '';
  const part = title.split('—')[0]?.trim();
  return part || '';
}

export function parseSpyFindings(findings) {
  const troops = {};
  if (!findings) return troops;

  const pattern = /([\d.,]+)\s+(Piyade|Tank|Zırhlı Araç|Keskin Nişancı|Özel Tim)/gi;
  let match = pattern.exec(findings);
  while (match) {
    const amount = Number(match[1].replace(/\./g, '').replace(',', '.'));
    const id = NAME_TO_ID[match[2].toLowerCase()];
    if (id && !Number.isNaN(amount)) troops[id] = amount;
    match = pattern.exec(findings);
  }
  return troops;
}

export function getEnemyTroopsFromReport(report) {
  if (!report || report.filterType !== 'spy' || !report.intelSuccess) return null;
  if (report.enemyTroops && Object.keys(report.enemyTroops).length > 0) {
    return report.enemyTroops;
  }
  const parsed = parseSpyFindings(report.findings);
  return Object.keys(parsed).length > 0 ? parsed : null;
}

export function findSpyReportForCity(reports, cityName) {
  if (!cityName) return null;
  const normalized = normalizeMapCityKey(cityName);
  return reports.find((r) => {
    if (r.filterType !== 'spy') return false;
    if (r.caught || r.intelSuccess === false) return false;
    const hasIntel = r.intelSuccess === true
      || (r.intelDepth ?? 0) >= 1
      || (r.intelFields ?? []).some((f) => String(f.key).startsWith('res-') && f.value);
    if (!hasIntel) return false;
    const targets = [
      r.targetCity,
      extractCityFromReportTitle(r.title),
    ].filter(Boolean);
    return targets.some((t) => normalizeMapCityKey(t) === normalized);
  }) ?? null;
}

const INTEL_RESOURCE_IDS = ['food', 'fuel', 'hammadde', 'money', 'energy', 'uranium'];
const INTEL_RESOURCE_ICONS = {
  food: '👥',
  fuel: '🛢️',
  hammadde: '🧱',
  energy: '⚡',
  money: '💰',
  uranium: '☢️',
};

/** Casus / ajan raporundan harita popup kaynak satırları */
export function getMapResourceRowsFromIntel(report) {
  if (!report?.intelFields?.length) return null;
  const rows = [];
  for (const field of report.intelFields) {
    if (field.hidden || !field.value) continue;
    const keyMatch = String(field.key ?? '').match(/^res-(\w+)$/);
    const id = keyMatch?.[1];
    if (!id || !INTEL_RESOURCE_IDS.includes(id)) continue;
    rows.push({
      id,
      label: field.label?.replace(/\s*Deposu$/i, '') ?? id,
      icon: INTEL_RESOURCE_ICONS[id] ?? '📦',
      displayValue: field.value,
    });
  }
  return rows.length ? rows : null;
}
