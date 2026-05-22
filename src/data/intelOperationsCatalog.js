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
  return report.filterType === 'spy' && report.type === 'Ajan Operasyonu';
}
