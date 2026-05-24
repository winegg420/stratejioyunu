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

/**
 * Kara borsa yakalanma riski (%) — (mesafe_km / 1000) × ajan_sayısı × 5, üst sınır %95.
 * @param {{ agentCount?: number, distanceKm?: number }} params
 */
export function calcBlackMarketCaptureRiskPct({ agentCount = 0, distanceKm = 0 } = {}) {
  const agents = Math.max(0, Math.floor(Number(agentCount) || 0));
  const km = Math.max(0, Number(distanceKm) || 0);
  const pct = (km / 1000) * agents * 5;
  return Math.round(Math.min(95, Math.max(0, pct)));
}

/** Kara borsa listesinde görünen anonim kod adı (gerçek oyuncu adı gizlenir). */
export function blackMarketAgentAlias(sellerId, seed = Date.now()) {
  const base = String(sellerId ?? 'agent')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const num = ((base + Math.floor(seed)) % 8999) + 1000;
  return `ANONYMOUS_AGENT_${num}`;
}

export function randomBlackMarketAlias(sellerId, seed = Date.now()) {
  return blackMarketAgentAlias(sellerId, seed);
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
    alias: randomBlackMarketAlias(sellerId, now + Math.random() * 1000),
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
