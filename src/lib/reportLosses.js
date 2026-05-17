import { landUnits } from '../data/placeholder';
import { LEGACY_UNIT_NAME_TO_ID } from '../data/unitCatalog';

const NAME_TO_UNIT = {};
for (const unit of landUnits) {
  NAME_TO_UNIT[unit.id] = unit;
  NAME_TO_UNIT[unit.name.toLowerCase()] = unit;
}
for (const [legacy, id] of Object.entries(LEGACY_UNIT_NAME_TO_ID)) {
  const unit = landUnits.find((u) => u.id === id);
  if (unit) NAME_TO_UNIT[legacy] = unit;
}

function parseLossString(lossStr) {
  const map = {};
  if (!lossStr || lossStr === '—' || /garnizon|tüm|imha/i.test(lossStr)) return map;

  const pattern = /([\d.,]+)\s+([A-Za-zğüşıöçĞÜŞİÖÇ\s]+?)(?=,|$)/gi;
  let match = pattern.exec(lossStr);
  while (match) {
    const amount = Number(match[1].replace(/\./g, '').replace(',', '.'));
    const name = match[2].trim().toLowerCase();
    const unit = NAME_TO_UNIT[name];
    if (unit && !Number.isNaN(amount)) map[unit.id] = amount;
    match = pattern.exec(lossStr);
  }
  return map;
}

export function buildLossRows(sentPayload, lossStr, lossRowsFromReport) {
  if (lossRowsFromReport?.length) return lossRowsFromReport;

  const lostById = parseLossString(lossStr);
  const rows = [];

  if (sentPayload && typeof sentPayload === 'object' && !sentPayload.spies) {
    for (const unit of landUnits) {
      const sent = sentPayload[unit.id] || 0;
      if (sent <= 0 && !lostById[unit.id]) continue;
      rows.push({
        unitId: unit.id,
        name: unit.name,
        icon: unit.image,
        sent,
        lost: lostById[unit.id] ?? 0,
      });
    }
    if (rows.length) return rows;
  }

  for (const unit of landUnits) {
    const lost = lostById[unit.id];
    if (lost == null) continue;
    rows.push({
      unitId: unit.id,
      name: unit.name,
      icon: unit.image,
      sent: lost,
      lost,
    });
  }

  return rows;
}

export function formatLossCell(lost) {
  if (!lost || lost === 0) {
    return { text: 'Kayıp Yok', className: 'report-loss-none' };
  }
  return { text: `-${Number(lost).toLocaleString('tr-TR')}`, className: 'report-loss-hit' };
}
