/**
 * MIL-AI Askeri Danışman — adım adım görevler ve ödüller.
 */
import { getHqLevel, getBuildingById } from './buildingUtils';

export const MIL_AI_QUESTS = [
  {
    id: 'build_refinery',
    title: 'Rafineri kurun',
    hint: 'Başkanım, petrol için rafineri inşa edin (Binalar → Yakıt Rafinerisi).',
    reward: { metal: 400, fuel: 600 },
    check: (state) => {
      const city = state.cities?.[state.activeCityId];
      return (getBuildingById(city, 'refinery')?.level ?? 0) >= 1;
    },
  },
  {
    id: 'tax_balance',
    title: 'Vergiyi dengeleyin',
    hint: 'Bütçeyi dengelemek için vergi oranını %15 civarında tutun.',
    reward: { metal: 300, fuel: 200, money: 500 },
    check: (state) => {
      const city = state.cities?.[state.activeCityId];
      const rate = city?.taxRate ?? 15;
      return rate >= 12 && rate <= 18;
    },
  },
  {
    id: 'upgrade_hq',
    title: 'Komuta merkezini yükseltin',
    hint: 'Üssü büyütmek için Komuta Merkezini Sv.2 yapın.',
    reward: { metal: 800, fuel: 500 },
    check: (state) => getHqLevel(state.cities?.[state.activeCityId]) >= 2,
  },
  {
    id: 'build_farm',
    title: 'Lojistik tarım tesisi',
    hint: 'Nüfus üretimi için tarım tesisi kurun.',
    reward: { metal: 500, fuel: 400, money: 800 },
    check: (state) => (getBuildingById(state.cities?.[state.activeCityId], 'farm')?.level ?? 0) >= 1,
  },
];

export function getActiveMilAiQuest(state) {
  const done = new Set(state.milAiCompleted ?? []);
  return MIL_AI_QUESTS.find((q) => !done.has(q.id)) ?? null;
}

export function getMilAiRewardLabel(reward) {
  const parts = [];
  if (reward.metal) parts.push(`${reward.metal} metal`);
  if (reward.fuel) parts.push(`${reward.fuel} petrol`);
  if (reward.money) parts.push(`${reward.money} bütçe`);
  return parts.join(' · ') || 'Kaynak';
}
