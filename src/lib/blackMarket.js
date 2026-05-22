import { genId } from './gameUtils';

export const BLACK_MARKET_TYPES = {
  AGENT_RENTAL: 'agent_rental',
  CONTRABAND: 'contraband',
  STOLEN_GOODS: 'stolen_goods',
};

export const BLACK_MARKET_LABELS = {
  [BLACK_MARKET_TYPES.AGENT_RENTAL]: 'Paralı Ajan Kiralama',
  [BLACK_MARKET_TYPES.CONTRABAND]: 'Yasak Silah Ticareti',
  [BLACK_MARKET_TYPES.STOLEN_GOODS]: 'Çalıntı Kaynak',
};

/** İşlemde yakalanma olasılığı (0–1) */
export const BLACK_MARKET_EXPOSURE_CHANCE = 0.14;

const ALIASES = [
  'Gölge-7', 'Kartal-X', 'Sis-12', 'Köprü-0', 'Karanlık Hat',
  'Anonim Broker', 'Kuzey Kanalı', 'Delta-9', 'Perde-3',
];

export function randomBlackMarketAlias(seed = Date.now()) {
  return ALIASES[Math.floor(seed % ALIASES.length)];
}

export function createBlackMarketListing({
  type,
  title,
  price,
  qty = 1,
  resourceId = null,
  sellerId,
  now = Date.now(),
}) {
  return {
    id: genId('bm'),
    type,
    title: title || BLACK_MARKET_LABELS[type],
    price: Math.max(0, Math.floor(price)),
    qty: Math.max(1, Math.floor(qty)),
    resourceId,
    alias: randomBlackMarketAlias(now + Math.random() * 1000),
    sellerId,
    status: 'open',
    at: now,
  };
}

export function rollBlackMarketExposure() {
  return Math.random() < BLACK_MARKET_EXPOSURE_CHANCE;
}

export function buildExposureCrisisNews(alias, now = Date.now()) {
  return {
    at: now,
    type: 'diplomatic-crisis',
    text: `[ KARA BORSA ] Anonim satıcı (${alias}) yakalandı — diplomatik kriz tetiklendi!`,
  };
}
