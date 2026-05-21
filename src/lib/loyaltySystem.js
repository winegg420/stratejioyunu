/**
 * İdeoloji Sadakat Puanı — doktrine uygun davranışları ödüllendirir.
 * Rejim değişimi: 7 gün ücretsiz, sonrası oyun içi Bütçe (ileride gerçek para).
 */

import { normalizeIdeology } from './ideologySystem';

export const LOYALTY_ACTION = {
  NATIONALIST_EXPEDITION_WIN: 'nationalist_expedition_win',
  CAPITALIST_BUDGET_SURGE: 'capitalist_budget_surge',
  SOCIALIST_RESOURCE_AID: 'socialist_resource_aid',
  TECHNOCRAT_RESEARCH_COMPLETE: 'technocrat_research_complete',
};

/** Koruma sonrası ideoloji değişim maliyeti (Bütçe / money) */
export const IDEOLOGY_CHANGE_COST_MONEY = 48_000;

/** Rejim değişiminde tüm şehirlerde ek mutluluk düşüşü */
export const REGIME_CHANGE_HAPPINESS_DROP = 28;

/** Kapitalist: tek tick'te toplam bütçe artışı eşiği */
export const CAPITALIST_BUDGET_SURGE_THRESHOLD = 900;

/** Sosyalist: kendi şehrine kaynak yardımı minimum toplam */
export const SOCIALIST_AID_MIN_TOTAL = 400;

const LOYALTY_BY_IDEOLOGY = {
  nationalist: {
    [LOYALTY_ACTION.NATIONALIST_EXPEDITION_WIN]: 140,
  },
  capitalist: {
    [LOYALTY_ACTION.CAPITALIST_BUDGET_SURGE]: 75,
  },
  socialist: {
    [LOYALTY_ACTION.SOCIALIST_RESOURCE_AID]: 110,
  },
  technocrat: {
    [LOYALTY_ACTION.TECHNOCRAT_RESEARCH_COMPLETE]: 95,
  },
};

const AID_RESOURCE_IDS = new Set(['food', 'metal', 'fuel']);

export function getLoyaltyPoints(ideology, action) {
  const id = normalizeIdeology(ideology);
  if (!id || !action) return 0;
  return LOYALTY_BY_IDEOLOGY[id]?.[action] ?? 0;
}

export function sumPlayerMoney(cities) {
  let total = 0;
  for (const city of Object.values(cities ?? {})) {
    const money = (city.resources ?? []).find((r) => r.id === 'money');
    total += money?.current ?? 0;
  }
  return total;
}

export function getActiveCityMoney(cities, activeCityId) {
  const city = cities?.[activeCityId];
  const money = city?.resources?.find((r) => r.id === 'money');
  return money?.current ?? 0;
}

export function isSocialistAidPayload(resources) {
  if (!resources) return false;
  if (Array.isArray(resources)) {
    let total = 0;
    for (const row of resources) {
      if (!AID_RESOURCE_IDS.has(row.id)) continue;
      total += row.amount ?? row.qty ?? 0;
    }
    return total >= SOCIALIST_AID_MIN_TOTAL;
  }
  let total = 0;
  for (const id of AID_RESOURCE_IDS) {
    total += Math.max(0, Number(resources[id]) || 0);
  }
  return total >= SOCIALIST_AID_MIN_TOTAL;
}

export function buildRegimeChangeNewsText(playerName) {
  const name = playerName?.trim() || 'Oyuncu';
  return `[ REJİM DEĞİŞİKLİĞİ ]: President ${name} ülkenin yeni doktrinini ilan etti!`;
}

export function formatLoyaltyScore(score) {
  const n = Math.max(0, Math.floor(score ?? 0));
  return n.toLocaleString('tr-TR');
}

/** İleride mağaza / gerçek para ile değişim için bilgi metni */
export const IDEOLOGY_CHANGE_REAL_MONEY_NOTE =
  'Koruma süresinden sonra ideoloji değişimi yüksek Bütçe ile yapılır. İleride mağaza üzerinden gerçek para seçeneği eklenecek.';
