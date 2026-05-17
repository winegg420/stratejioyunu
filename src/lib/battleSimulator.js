import { landUnits } from '../data/placeholder';

const UNIT_MAP = Object.fromEntries(landUnits.map((u) => [u.id, u]));

export function getUnitCombatDefs() {
  return UNIT_MAP;
}

export function simulateBattle(attackerCounts, defenderCounts) {
  let atkPower = 0;
  let defPower = 0;

  for (const [id, count] of Object.entries(attackerCounts)) {
    const n = Number(count) || 0;
    if (n <= 0) continue;
    const u = UNIT_MAP[id];
    if (u) atkPower += n * u.attack;
  }

  for (const [id, count] of Object.entries(defenderCounts)) {
    const n = Number(count) || 0;
    if (n <= 0) continue;
    const u = UNIT_MAP[id];
    if (u) defPower += n * u.defense;
  }

  const totalAtk = Object.values(attackerCounts).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalDef = Object.values(defenderCounts).reduce((a, b) => a + (Number(b) || 0), 0);

  if (totalAtk < 1) {
    return {
      attackerPower: 0,
      defenderPower: defPower,
      winProbability: 0,
      outcome: 'invalid',
      outcomeLabel: 'Saldırı birliği girin',
      attackerLossPct: 0,
      defenderLossPct: 0,
    };
  }

  if (totalDef < 1) {
    return {
      attackerPower: atkPower,
      defenderPower: 0,
      winProbability: 98,
      outcome: 'win',
      outcomeLabel: 'Zafer çok olası (boş garnizon)',
      attackerLossPct: 5,
      defenderLossPct: 100,
    };
  }

  const ratio = atkPower / Math.max(1, defPower);
  const winProbability = Math.round(Math.min(95, Math.max(5, (ratio / (ratio + 0.85)) * 100)));

  let outcome;
  let outcomeLabel;
  if (winProbability >= 70) {
    outcome = 'win';
    outcomeLabel = 'Zafer olası';
  } else if (winProbability >= 45) {
    outcome = 'uncertain';
    outcomeLabel = 'Belirsiz — kayıplar yüksek olabilir';
  } else {
    outcome = 'loss';
    outcomeLabel = 'Yenilgi riski yüksek';
  }

  const attackerLossPct = Math.round(Math.max(8, Math.min(85, 55 - winProbability * 0.35)));
  const defenderLossPct = Math.round(Math.max(15, Math.min(95, winProbability * 0.75)));

  return {
    attackerPower: atkPower,
    defenderPower: defPower,
    winProbability,
    outcome,
    outcomeLabel,
    attackerLossPct,
    defenderLossPct,
  };
}
