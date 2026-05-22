/** Geriye uyumluluk — asıl motor: cbrnEngine.js */
export {
  calcCbrnIntrusionChance as calcKbrnIntrusionChance,
  calcKbrnChemTravelSeconds,
  getCbrnChemOpCost,
  getCbrnChemOpCost as getKbrnChemOpCost,
  resolveDefenderDeconLevel,
  resolveKbrnChemMission,
  buildKbrnOpsReport,
  buildKbrnDefenderAlertReport,
  formatCbrnProtocolFields as formatKbrnProtocolFields,
  CBNS_STEALTH_DURATION_MS,
  CBNS_CHEM_OP_ID,
} from './cbrnEngine';

export const KBRN_EFFECT_DURATION_MS = 60 * 60 * 1000;
export const KBRN_CHEM_OP_ID = 'chem_pressure';

export const KBRN_CHEM_OPERATIONS = [
  {
    id: 'chem_pressure',
    name: 'KBRN Silahı — Sinsi Baskı',
    subtitle: 'Kimyasal/biyolojik ajan',
    desc: '1 saat geçici felç — kaynak gizli',
    minChemLevel: 1,
    baseCost: '120.000 bütçe · 55.000 hammadde · 22.000 enerji · 15.000 nüfus · 8.000 reaktör',
  },
];
