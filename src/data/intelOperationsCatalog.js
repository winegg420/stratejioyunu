/** Ajan operasyonları — İstihbarat sayfası */
export const AGENT_OPERATIONS = [
  {
    id: 'scout',
    name: 'Keşif Ajanı',
    desc: 'Hedef üssün askeri varlık ve garnizon dağılımını tespit eder.',
    cost: '1 ajan · 120 nüfus',
  },
  {
    id: 'sabotage',
    name: 'Sabotaj',
    desc: 'Üretim tesislerine müdahale — hedef üretim hatlarında geçici yavaşlama.',
    cost: '1 ajan · 150 nüfus',
  },
  {
    id: 'infiltrate',
    name: 'Sızma Timi',
    desc: 'Komuta planı ve lojistik verisi sızdırır; detaylı istihbarat raporu üretir.',
    cost: '1 ajan · 180 nüfus',
  },
];

export const KBRN_CHEM_PRESSURE_OP = {
  id: 'chem_pressure',
  name: 'Kimyasal Baskı',
  desc: 'Hedef şehirde nüfus hastalanır, mutluluk düşer, üretim verimi azalır — etki geçicidir.',
  researchRequired: 'KBRN Silah Programı (İleri Doktrin)',
};

export function isOperationReport(report) {
  if (!report) return false;
  if (report.kbrnAlert) return false;
  if (report.reportCategory === 'operation') return true;
  if (report.filterType === 'cyber') return true;
  if (report.filterType === 'kbrn') return true;
  if (report.type === 'Siber Operasyon' || report.type === 'Ajan Operasyonu') return true;
  if (report.cyberSuccess != null || report.operationSuccess != null) return true;
  return report.filterType === 'spy' && report.type === 'Ajan Operasyonu';
}

function reportSortKey(report) {
  const raw = report?.date ?? '';
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return parsed;
  const idNum = Number(String(report?.id ?? '').replace(/\D/g, ''));
  return Number.isFinite(idNum) ? idNum : 0;
}

export function getLatestOperationReport(reports = []) {
  return [...reports]
    .filter(isOperationReport)
    .sort((a, b) => reportSortKey(b) - reportSortKey(a))[0] ?? null;
}
