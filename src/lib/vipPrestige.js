/** VIP Atma (prestige) — eşik ve kalıcı bonuslar */

export const MIN_VIP_DEVELOPMENT_SCORE = 1_200;
export const VIP_PRODUCTION_BONUS_PER_TIER = 0.05;

export const VIP_BADGE_LABEL = 'VIP Askeri Madalyası';

export function getVipBadgeForTier(tier) {
  return `${VIP_BADGE_LABEL} · Katman ${tier}`;
}

export function getVipProductionMultiplier(vipTier = 0) {
  return 1 + Math.max(0, vipTier) * VIP_PRODUCTION_BONUS_PER_TIER;
}

export function computeDevelopmentScore(state) {
  if (!state?.cities) return 0;
  let score = 0;

  for (const city of Object.values(state.cities)) {
    const buildingLevels = (city.buildings ?? []).reduce((s, b) => s + (b.level ?? 0), 0);
    score += buildingLevels * 120;
    score += (city.idleTroops ?? []).reduce((s, t) => s + (t.available ?? 0), 0) * 3;
    score += Math.floor((city.idlePopulation ?? 0) / 10);
    score += (city.idleSpies ?? 0) * 25;
    score += (city.idleAgents ?? 0) * 40;
    for (const r of city.resources ?? []) {
      score += Math.floor((r.current ?? 0) / 500);
    }
  }

  score += (state.playerCities?.length ?? 0) * 400;
  score += (state.researches ?? []).reduce((s, r) => s + (r.level ?? 0) * 80, 0);

  return Math.floor(score);
}

export function canOfferVipAscension(state) {
  return computeDevelopmentScore(state) >= MIN_VIP_DEVELOPMENT_SCORE;
}

export function formatVipBonusPercent(vipTier) {
  return `+%${Math.round(vipTier * VIP_PRODUCTION_BONUS_PER_TIER * 100)}`;
}
