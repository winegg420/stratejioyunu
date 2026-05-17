import { landUnits } from '../data/placeholder';
import { LEGACY_UNIT_NAME_TO_ID } from '../data/unitCatalog';

const NAME_TO_ID = {
  ...LEGACY_UNIT_NAME_TO_ID,
  ...Object.fromEntries(landUnits.map((u) => [u.name.toLowerCase(), u.id])),
};

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
  const normalized = cityName.toLowerCase();
  return reports.find(
    (r) =>
      r.filterType === 'spy'
      && r.intelSuccess
      && (
        r.targetCity?.toLowerCase() === normalized
        || extractCityFromReportTitle(r.title).toLowerCase() === normalized
      ),
  ) ?? null;
}
