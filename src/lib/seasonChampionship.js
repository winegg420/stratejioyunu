/**
 * Sezon yarışmaları — haftalık/aylık dinamik tablolar, kozmetik unvan + sadakat ödülü.
 */
import { genId } from './gameUtils';
import { applyLoyaltyDelta } from './loyaltySystem';
export const SEASON_PERIOD = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const COMPETITION_TYPES = {
  HAMMADDE_PRODUCTION: 'hammadde_production',
  CYBER_OPS: 'cyber_ops',
  CITIES_CONQUERED: 'cities_conquered',
  EXPEDITION_WINS: 'expedition_wins',
  TRADE_VOLUME: 'trade_volume',
};

const COMPETITION_DEFS = {
  [COMPETITION_TYPES.HAMMADDE_PRODUCTION]: {
    id: COMPETITION_TYPES.HAMMADDE_PRODUCTION,
    label: 'En çok Hammadde üreten',
    statKey: 'hammaddeProduced',
    period: SEASON_PERIOD.WEEKLY,
  },
  [COMPETITION_TYPES.CYBER_OPS]: {
    id: COMPETITION_TYPES.CYBER_OPS,
    label: 'En çok siber operasyon yapan',
    statKey: 'cyberOpsCount',
    period: SEASON_PERIOD.WEEKLY,
  },
  [COMPETITION_TYPES.CITIES_CONQUERED]: {
    id: COMPETITION_TYPES.CITIES_CONQUERED,
    label: 'En çok şehir fetheden',
    statKey: 'citiesFounded',
    period: SEASON_PERIOD.MONTHLY,
  },
  [COMPETITION_TYPES.EXPEDITION_WINS]: {
    id: COMPETITION_TYPES.EXPEDITION_WINS,
    label: 'En çok başarılı saldırı',
    statKey: 'attackWins',
    period: SEASON_PERIOD.WEEKLY,
  },
  [COMPETITION_TYPES.TRADE_VOLUME]: {
    id: COMPETITION_TYPES.TRADE_VOLUME,
    label: 'En yüksek ticaret hacmi',
    statKey: 'tradeVolume',
    period: SEASON_PERIOD.MONTHLY,
  },
};

const WEEKLY_POOL = [
  COMPETITION_TYPES.HAMMADDE_PRODUCTION,
  COMPETITION_TYPES.CYBER_OPS,
  COMPETITION_TYPES.EXPEDITION_WINS,
];

const MONTHLY_POOL = [
  COMPETITION_TYPES.CITIES_CONQUERED,
  COMPETITION_TYPES.TRADE_VOLUME,
  COMPETITION_TYPES.HAMMADDE_PRODUCTION,
];

/** Kozmetik unvanlar — kaynak/ordu yok */
export const SEASON_COSMETIC_REWARDS = {
  1: { titleId: 'season_gold', label: 'Altın Sezon Komutanı', badge: '🥇' },
  2: { titleId: 'season_silver', label: 'Gümüş Sezon Subayı', badge: '🥈' },
  3: { titleId: 'season_bronze', label: 'Bronz Sezon Gözcüsü', badge: '🥉' },
};

export const SEASON_LOYALTY_REWARDS = {
  1: 1200,
  2: 750,
  3: 420,
};

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;

function periodKey(period, now = Date.now()) {
  const d = new Date(now);
  if (period === SEASON_PERIOD.MONTHLY) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.floor((now - jan1) / MS_WEEK);
  return `${d.getUTCFullYear()}-W${week}`;
}

function pickCompetition(period, now = Date.now()) {
  const pool = period === SEASON_PERIOD.MONTHLY ? MONTHLY_POOL : WEEKLY_POOL;
  const key = periodKey(period, now);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  return pool[hash % pool.length];
}

export function migrateSeasonStats(stats) {
  if (!stats || typeof stats !== 'object') return createDefaultSeasonStats();
  const next = { ...stats };
  if (next.metalProduced != null && next.hammaddeProduced == null) {
    next.hammaddeProduced = next.metalProduced;
    delete next.metalProduced;
  }
  return next;
}

export function createDefaultSeasonStats() {
  return {
    hammaddeProduced: 0,
    cyberOpsCount: 0,
    citiesFounded: 0,
    attackWins: 0,
    tradeVolume: 0,
    unitsTrained: 0,
    expeditionsLaunched: 0,
    researchCompleted: 0,
    weekKey: periodKey(SEASON_PERIOD.WEEKLY),
    monthKey: periodKey(SEASON_PERIOD.MONTHLY),
  };
}

export function rolloverSeasonStats(stats, now = Date.now()) {
  const next = { ...createDefaultSeasonStats(), ...stats };
  const wk = periodKey(SEASON_PERIOD.WEEKLY, now);
  const mo = periodKey(SEASON_PERIOD.MONTHLY, now);
  if (next.weekKey !== wk) {
    next.hammaddeProduced = 0;
    next.cyberOpsCount = 0;
    next.attackWins = 0;
    next.expeditionsLaunched = 0;
    next.unitsTrained = 0;
    next.weekKey = wk;
  }
  if (next.monthKey !== mo) {
    next.citiesFounded = 0;
    next.tradeVolume = 0;
    next.researchCompleted = 0;
    next.monthKey = mo;
  }
  return next;
}

export function createSeasonEngagementState(now = Date.now()) {
  const weeklyType = pickCompetition(SEASON_PERIOD.WEEKLY, now);
  const monthlyType = pickCompetition(SEASON_PERIOD.MONTHLY, now);
  return {
    weekly: {
      period: SEASON_PERIOD.WEEKLY,
      periodKey: periodKey(SEASON_PERIOD.WEEKLY, now),
      competitionType: weeklyType,
      endsAt: endOfWeek(now),
      claimedRanks: [],
    },
    monthly: {
      period: SEASON_PERIOD.MONTHLY,
      periodKey: periodKey(SEASON_PERIOD.MONTHLY, now),
      competitionType: monthlyType,
      endsAt: endOfMonth(now),
      claimedRanks: [],
    },
  };
}

function endOfWeek(now) {
  const d = new Date(now);
  const day = d.getUTCDay();
  const daysUntil = day === 0 ? 0 : 7 - day;
  d.setUTCDate(d.getUTCDate() + daysUntil);
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

function endOfMonth(now) {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

export function syncSeasonEngagement(engagement, now = Date.now()) {
  let next = engagement ?? createSeasonEngagementState(now);
  const fresh = createSeasonEngagementState(now);
  if (next.weekly?.periodKey !== fresh.weekly.periodKey) {
    next = { ...next, weekly: fresh.weekly };
  }
  if (next.monthly?.periodKey !== fresh.monthly.periodKey) {
    next = { ...next, monthly: fresh.monthly };
  }
  return next;
}

export function getCompetitionDef(type) {
  return COMPETITION_DEFS[type] ?? null;
}

export function getPlayerSeasonScore(stats, competitionType) {
  const def = getCompetitionDef(competitionType);
  if (!def) return 0;
  return stats?.[def.statKey] ?? 0;
}

export function buildSeasonLeaderboard({
  playerName,
  playerScore,
  liveRows = [],
}) {
  const selfRow = {
    playerName,
    displayName: playerName,
    score: playerScore,
    isSelf: true,
  };

  const merged = [...liveRows];
  const selfIdx = merged.findIndex((r) => r.playerName === playerName);
  if (selfIdx >= 0) {
    merged[selfIdx] = { ...merged[selfIdx], isSelf: true };
  } else if (playerScore > 0 || liveRows.length === 0) {
    merged.push(selfRow);
  }

  merged.sort((a, b) => b.score - a.score);
  return merged.map((r, idx) => ({ ...r, rank: idx + 1 }));
}

export function getPlayerSeasonRank(leaderboard, playerName) {
  const row = leaderboard.find((r) => r.playerName === playerName);
  return row?.rank ?? null;
}

export function canClaimSeasonReward(engagement, period, rank) {
  const block = period === SEASON_PERIOD.MONTHLY ? engagement?.monthly : engagement?.weekly;
  if (!block || rank > 3) return false;
  return !block.claimedRanks?.includes(rank);
}

export function claimSeasonReward({
  engagement,
  period,
  rank,
  loyaltyScore,
  cosmeticTitles = [],
}) {
  if (!canClaimSeasonReward(engagement, period, rank)) {
    return { ok: false, reason: 'Ödül zaten alındı veya derece yok' };
  }
  const cosmetic = SEASON_COSMETIC_REWARDS[rank];
  const loyaltyGain = SEASON_LOYALTY_REWARDS[rank] ?? 0;
  const blockKey = period === SEASON_PERIOD.MONTHLY ? 'monthly' : 'weekly';
  const block = engagement[blockKey];
  const nextEngagement = {
    ...engagement,
    [blockKey]: {
      ...block,
      claimedRanks: [...(block.claimedRanks ?? []), rank],
    },
  };
  const nextTitles = [...cosmeticTitles];
  if (cosmetic && !nextTitles.includes(cosmetic.label)) {
    nextTitles.push(cosmetic.label);
  }
  return {
    ok: true,
    engagement: nextEngagement,
    loyaltyScore: applyLoyaltyDelta(loyaltyScore, loyaltyGain),
    cosmetic,
    loyaltyGain,
  };
}

export function recordSeasonStat(stats, key, amount = 1) {
  const rolled = rolloverSeasonStats(stats);
  return {
    ...rolled,
    [key]: (rolled[key] ?? 0) + amount,
  };
}

export function formatSeasonCountdown(endsAt, now = Date.now()) {
  const diff = Math.max(0, endsAt - now);
  const days = Math.floor(diff / MS_DAY);
  const hours = Math.floor((diff % MS_DAY) / (3600000));
  if (days > 0) return `${days} gün ${hours} sa`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours} sa ${mins} dk`;
}
