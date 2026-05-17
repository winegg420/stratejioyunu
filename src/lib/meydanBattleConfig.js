/** Modül 9 — Meydan Savaşı (istila) hazırlık ve geri çekilme kuralları */
export const MEYDAN_PREP_SECONDS = 24 * 3600;
export const MEYDAN_RECALL_LOCK_SECONDS = 5 * 60;

export function getMeydanBattleAt(declaredAt = Date.now()) {
  return declaredAt + MEYDAN_PREP_SECONDS * 1000;
}

export function canRecallMeydanTroops(battle, now = Date.now()) {
  if (!battle || battle.status !== 'preparing') return false;
  return battle.battleAt - now > MEYDAN_RECALL_LOCK_SECONDS * 1000;
}

export function meydanRecallLockLabel(battle, now = Date.now()) {
  const msLeft = battle.battleAt - now - MEYDAN_RECALL_LOCK_SECONDS * 1000;
  if (msLeft <= 0) return 'Son 5 dk — geri çekilemez';
  const min = Math.ceil(msLeft / 60000);
  return `Geri çekme: savaşa ${min} dk kala kilitlenir`;
}
