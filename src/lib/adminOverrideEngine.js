/**
 * Admin Müdahale Motoru — Merkez Bankası, bölgesel teşvik, şeffaf loglama.
 */
import { genId } from './gameUtils';
import { getRegionForCoords, CBNS_REGIONS, createNewsFeedEntry } from '../utils/cbrnEngine';
import {
  RESOURCE_IDS,
  getResourceDisplay,
  migrateCentralBankParities,
} from '../data/resourceCatalog';
import { formatCrisisLabel, CRISIS_TYPE } from './crisisEngine';

export const ADMIN_LOG_TAG = '[ ADMİN OVERRIDE LOG ]';

export const ADMIN_ACTION = {
  CRISIS: 'crisis',
  CENTRAL_BANK: 'central_bank',
  REGIONAL_INCENTIVE: 'regional_incentive',
  CLEAR_INCENTIVE: 'clear_incentive',
};

export const DEFAULT_SERVER_ID = 'turkiye-1';

export const DEFAULT_PARITIES = {
  food: 1,
  fuel: 1,
  hammadde: 1,
  money: 1,
  energy: 1,
};

export const DEFAULT_CENTRAL_BANK = {
  fuelBasePrice: 1,
  parities: { ...DEFAULT_PARITIES },
  updatedAt: null,
};

export const PARITY_MIN = 0.25;
export const PARITY_MAX = 3;
export const FUEL_PRICE_MIN = 0.25;
export const FUEL_PRICE_MAX = 3;

export const REGION_RESOURCE_IDS = ['hammadde', 'food', 'fuel', 'money'];

export function normalizeCentralBank(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const parities = migrateCentralBankParities({
    ...DEFAULT_PARITIES,
    ...(base.parities ?? {}),
  });
  for (const id of Object.keys(parities)) {
    parities[id] = clamp(Number(parities[id]) || 1, PARITY_MIN, PARITY_MAX);
  }
  return {
    fuelBasePrice: clamp(Number(base.fuelBasePrice) || 1, FUEL_PRICE_MIN, FUEL_PRICE_MAX),
    parities,
    updatedAt: base.updatedAt ?? null,
  };
}

export function normalizeRegionalIncentive(raw, now = Date.now()) {
  if (!raw || !raw.active) return null;
  const endsAt = raw.endsAt != null ? Number(raw.endsAt) : null;
  if (endsAt != null && endsAt <= now) return null;
  const region = CBNS_REGIONS.find((r) => r.id === raw.regionId) ?? { id: raw.regionId, name: raw.regionName ?? raw.regionId };
  return {
    active: true,
    regionId: region.id,
    regionName: region.name ?? raw.regionName,
    resourceId: REGION_RESOURCE_IDS.includes(raw.resourceId) ? raw.resourceId : 'hammadde',
    multiplier: clamp(Number(raw.multiplier) || 1, 1, 4),
    endsAt,
    announcedAt: raw.announcedAt ?? now,
  };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function resolveCityRegionId(playerCity, mapCities) {
  if (!playerCity) return null;
  const mc = (mapCities ?? []).find((m) => m.name === playerCity.name || m.id === playerCity.id);
  if (mc?.lat != null && mc?.lng != null) {
    return getRegionForCoords(mc.lat, mc.lng).id;
  }
  return null;
}

export function getRegionalProductionMult(incentive, regionId, resourceId) {
  if (!incentive?.active || !regionId || incentive.regionId !== regionId) return 1;
  if (incentive.resourceId !== resourceId) return 1;
  return incentive.multiplier ?? 1;
}

/** Ticaret teslimatı — ideoloji × merkez bankası pariteleri */
export function scaleTradeWithCentralBank(amounts = {}, ideologyMult = 1, centralBank = DEFAULT_CENTRAL_BANK) {
  const bank = normalizeCentralBank(centralBank);
  const scaled = {};
  for (const id of RESOURCE_IDS) {
    const raw = Math.max(0, Number(amounts[id]) || 0);
    if (raw <= 0) {
      scaled[id] = 0;
      continue;
    }
    let mult = ideologyMult * (bank.parities[id] ?? 1);
    if (id === 'fuel') mult *= bank.fuelBasePrice;
    scaled[id] = Math.max(0, Math.floor(raw * mult));
  }
  return scaled;
}

export function buildCentralBankLogText(centralBank, prev) {
  const bank = normalizeCentralBank(centralBank);
  const fuelCh = prev && prev.fuelBasePrice !== bank.fuelBasePrice
    ? ` Petrol taban fiyatı ×${bank.fuelBasePrice.toFixed(2)}`
    : ` Petrol taban ×${bank.fuelBasePrice.toFixed(2)}`;
  const parityParts = REGION_RESOURCE_IDS.filter((id) => bank.parities[id] !== 1)
    .map((id) => {
      const { label } = getResourceDisplay(id);
      return `${label} ×${bank.parities[id].toFixed(2)}`;
    });
  const parityStr = parityParts.length ? ` · Parite: ${parityParts.join(', ')}` : '';
  return `${ADMIN_LOG_TAG} Merkez Bankası müdahalesi —${fuelCh}${parityStr}`;
}

export function buildRegionalIncentiveLogText(incentive) {
  if (!incentive?.active) {
    return `${ADMIN_LOG_TAG} Bölgesel teşvik protokolü sonlandırıldı.`;
  }
  const { label } = getResourceDisplay(incentive.resourceId);
  const mult = incentive.multiplier ?? 2;
  return `${ADMIN_LOG_TAG} Teşvik Protokolü: ${incentive.regionName} — ${label} üretimi ×${mult} (geçici).`;
}

export function buildCrisisAdminLogText({ type, catastrophic }) {
  const label = formatCrisisLabel(type);
  const tag = catastrophic || type === CRISIS_TYPE.EARTHQUAKE
    ? 'KÜRESEL ACİL DURUM'
    : 'DOĞAL AFET ALARMI';
  return `${ADMIN_LOG_TAG} [ ${tag} ] Kurucu tetikledi: ${label}`;
}

export function createAdminNewsEntry(text, actionType, at = Date.now()) {
  return createNewsFeedEntry({
    type: 'admin-override',
    text,
    at,
  });
}

export function adminLogToNewsItem(row) {
  return {
    id: row.id ?? genId('alog'),
    type: 'admin-override',
    text: row.log_text ?? row.text ?? ADMIN_LOG_TAG,
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : '—',
    at: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export function mergeAdminLogsIntoNews(newsLog = [], adminLogs = [], limit = 48) {
  const adminNews = (adminLogs ?? []).map(adminLogToNewsItem);
  const merged = [...adminNews, ...(newsLog ?? [])];
  const seen = new Set();
  const out = [];
  for (const item of merged) {
    const key = item.id ?? item.text;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.slice(0, limit);
}

export function getDefaultServerBroadcast() {
  return {
    serverId: DEFAULT_SERVER_ID,
    centralBank: { ...DEFAULT_CENTRAL_BANK },
    regionalIncentive: null,
    updatedAt: null,
  };
}
