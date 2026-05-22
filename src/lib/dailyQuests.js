/**
 * İdeoloji tabanlı günlük görevler — gece yarısı sıfırlanır.
 */
import { genId } from './gameUtils';
import { normalizeIdeology, IDEOLOGY_IDS } from './ideologySystem';
import { applyLoyaltyDelta } from './loyaltySystem';
import { isAiCenterOperational } from './aiCenterEngine';
import { sumTradeAmounts } from './tradeUtils';
import { isSocialistAidPayload } from './loyaltySystem';

export const DAILY_QUEST_COUNT = 3;

const QUEST_POOLS = {
  socialist: [
    {
      id: 'soc_aid',
      title: 'Halk Konvoyu',
      hint: 'Müttefik şehrine toplam 800+ kaynak gönder (ticaret seferi).',
      check: (ctx) => (ctx.seasonStats?.tradeVolume ?? 0) >= 800 && ctx.flags?.socialistAidSent,
      target: 800,
      reward: { loyalty: 85, hammadde: 400, fuel: 300 },
    },
    {
      id: 'soc_happy',
      title: 'Refah Hattı',
      hint: 'Aktif şehirde mutluluğu %85 üzerinde tut.',
      check: (ctx) => (ctx.activeCity?.happiness ?? 0) >= 85,
      reward: { loyalty: 70, money: 600 },
    },
    {
      id: 'soc_tax',
      title: 'Adil Vergi',
      hint: 'Vergi oranını %12–%18 aralığında dengele.',
      check: (ctx) => {
        const t = ctx.activeCity?.taxRate ?? 15;
        return t >= 12 && t <= 18;
      },
      reward: { loyalty: 55, food: 500 },
    },
  ],
  capitalist: [
    {
      id: 'cap_market',
      title: 'Borsa Hacmi',
      hint: 'Şehir bütçesinde 25.000+ birikim (aktif şehir).',
      check: (ctx) => {
        const money = ctx.activeCity?.resources?.find((r) => r.id === 'money');
        return (money?.current ?? 0) >= 25000;
      },
      reward: { loyalty: 90, money: 1200 },
    },
    {
      id: 'cap_convoy',
      title: 'Ticaret Konvoyu',
      hint: 'En az bir ticaret seferi tamamla.',
      check: (ctx) => (ctx.seasonStats?.tradeVolume ?? 0) >= 200,
      reward: { loyalty: 75, fuel: 500 },
    },
    {
      id: 'cap_production',
      title: 'Sanayi Çıktısı',
      hint: '500+ hammadde üret (haftalık sayaç).',
      check: (ctx) => (ctx.seasonStats?.hammaddeProduced ?? 0) >= 500,
      reward: { loyalty: 65, hammadde: 700 },
    },
  ],
  nationalist: [
    {
      id: 'nat_train',
      title: 'Ordu Mobilizasyonu',
      hint: 'Toplam 40+ askeri birim üret.',
      check: (ctx) => (ctx.seasonStats?.unitsTrained ?? 0) >= 40,
      reward: { loyalty: 95, hammadde: 600, fuel: 400 },
    },
    {
      id: 'nat_attack',
      title: 'Cephe Baskını',
      hint: 'Haritada başarılı saldırı seferi tamamla.',
      check: (ctx) => (ctx.seasonStats?.attackWins ?? 0) >= 1,
      reward: { loyalty: 110, money: 800 },
    },
    {
      id: 'nat_expedition',
      title: 'Sefer Disiplini',
      hint: '3 saldırı/casus seferi başlat.',
      check: (ctx) => (ctx.seasonStats?.expeditionsLaunched ?? 0) >= 3,
      reward: { loyalty: 60, fuel: 350 },
    },
  ],
  technocrat: [
    {
      id: 'tech_cyber',
      title: 'Siber Protokol',
      hint: 'Başarılı siber operasyon tamamla.',
      check: (ctx) => (ctx.seasonStats?.cyberOpsCount ?? 0) >= 1,
      reward: { loyalty: 100, energy: 400 },
    },
    {
      id: 'tech_ai',
      title: 'YZ Çevrimiçi',
      hint: 'Yapay Zeka Merkezini çalışır durumda tut.',
      check: (ctx) => isAiCenterOperational(ctx.activeCity),
      reward: { loyalty: 80, hammadde: 500 },
    },
    {
      id: 'tech_research',
      title: 'Ar-Ge İlerlemesi',
      hint: 'Bir araştırmayı tamamla veya yükselt.',
      check: (ctx) => (ctx.seasonStats?.researchCompleted ?? 0) >= 1,
      reward: { loyalty: 70, money: 900 },
    },
  ],
};

function dayKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function hashPick(pool, day, ideology) {
  const key = `${day}:${ideology}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 33 + key.charCodeAt(i)) % 100000;
  const picks = [];
  const used = new Set();
  while (picks.length < DAILY_QUEST_COUNT && picks.length < pool.length) {
    const idx = (h + picks.length * 17) % pool.length;
    if (!used.has(idx)) {
      used.add(idx);
      picks.push(pool[idx]);
    }
    h += 1;
  }
  return picks;
}

export function generateDailyQuests(ideology, now = Date.now()) {
  const id = normalizeIdeology(ideology) ?? IDEOLOGY_IDS[0];
  const pool = QUEST_POOLS[id] ?? QUEST_POOLS.technocrat;
  const day = dayKey(now);
  const templates = hashPick(pool, day, id);
  return {
    dayKey: day,
    ideology: id,
    quests: templates.map((t) => ({
      id: `${day}_${t.id}`,
      templateId: t.id,
      title: t.title,
      hint: t.hint,
      completed: false,
      claimed: false,
      reward: t.reward,
    })),
  };
}

export function syncDailyQuestsState(state, ideology, now = Date.now()) {
  const day = dayKey(now);
  if (!state || state.dayKey !== day) {
    return generateDailyQuests(ideology, now);
  }
  return state;
}

export function evaluateDailyQuests(questState, ctx) {
  if (!questState?.quests) return questState;
  const quests = questState.quests.map((q) => {
    const template = Object.values(QUEST_POOLS)
      .flat()
      .find((t) => q.templateId === t.id);
    const done = template?.check?.(ctx) ?? false;
    return { ...q, completed: done || q.completed };
  });
  return { ...questState, quests };
}

export function claimDailyQuest(questState, questId, loyaltyScore) {
  const quest = questState.quests.find((q) => q.id === questId);
  if (!quest) return { ok: false, reason: 'Görev bulunamadı' };
  if (!quest.completed) return { ok: false, reason: 'Görev henüz tamamlanmadı' };
  if (quest.claimed) return { ok: false, reason: 'Ödül zaten alındı' };

  const quests = questState.quests.map((q) => (
    q.id === questId ? { ...q, claimed: true } : q
  ));
  const loyaltyGain = quest.reward?.loyalty ?? 0;
  return {
    ok: true,
    questState: { ...questState, quests },
    loyaltyScore: applyLoyaltyDelta(loyaltyScore, loyaltyGain),
    resourceReward: quest.reward,
    loyaltyGain,
  };
}

export function applyQuestResourceReward(resources, reward) {
  if (!reward) return resources;
  return resources.map((r) => {
    let add = 0;
    if (r.id === 'hammadde' && reward.hammadde) add = reward.hammadde;
    if (r.id === 'fuel' && reward.fuel) add = reward.fuel;
    if (r.id === 'money' && reward.money) add = reward.money;
    if (r.id === 'food' && reward.food) add = reward.food;
    if (r.id === 'energy' && reward.energy) add = reward.energy;
    if (!add) return r;
    const cap = r.max ?? Number.POSITIVE_INFINITY;
    return { ...r, current: Math.min(cap, (r.current ?? 0) + add) };
  });
}

export function buildDailyQuestContext(state) {
  const activeCity = state.cities?.[state.activeCityId];
  return {
    activeCity,
    seasonStats: state.seasonStats,
    flags: state.dailyQuestFlags ?? {},
    researches: state.researches,
  };
}

export function markSocialistAidFlag(flags, sendAmounts) {
  if (!isSocialistAidPayload(sendAmounts)) return flags;
  return { ...flags, socialistAidSent: true };
}

export function markTradeVolume(stats, sendAmounts) {
  const vol = sumTradeAmounts(sendAmounts);
  return {
    ...stats,
    tradeVolume: (stats.tradeVolume ?? 0) + vol,
  };
}

export function msUntilDailyReset(now = Date.now()) {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(0, next - now);
}

export function formatDailyResetCountdown(now = Date.now()) {
  const ms = msUntilDailyReset(now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} sa ${m} dk`;
}
