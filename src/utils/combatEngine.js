import { landUnits } from '../data/placeholder';
import { inferCityTier } from '../map/cyberMapConfig';
import { genId, nowReportDate } from '../lib/gameUtils';

export const COMBAT_ROUNDS = 3;
export const LOOT_RATE = 0.3;
export const LOOT_RESOURCE_IDS = ['food', 'fuel', 'hammadde', 'money'];

const UNIT_MAP = Object.fromEntries(landUnits.map((u) => [u.id, u]));

const RESOURCE_META = {
  food: { label: 'Nüfus', icon: '👥' },
  fuel: { label: 'Petrol', icon: '🛢️' },
  hammadde: { label: 'Hammadde', icon: '🧱' },
  money: { label: 'Bütçe', icon: '💰' },
  energy: { label: 'Enerji', icon: '⚡' },
};

const ROUND_ATTACK_FACTOR = 0.38;
const ROUND_DEFENSE_ABSORB = 0.42;
const CASUALTY_PER_DAMAGE = 0.018;

function normalizeCounts(unitCounts = {}) {
  const out = {};
  for (const [id, raw] of Object.entries(unitCounts)) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    if (n > 0) out[id] = n;
  }
  return out;
}

function cloneCounts(counts) {
  return { ...counts };
}

function totalUnits(counts) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

/** Birim sayısı × nitelik — toplam saldırı gücü */
export function calcArmyAttackPower(unitCounts, unitDefs = UNIT_MAP) {
  let power = 0;
  for (const [id, count] of Object.entries(unitCounts)) {
    const unit = unitDefs[id];
    if (unit) power += count * (unit.attack ?? 0);
  }
  return Math.round(power);
}

/** Birim sayısı × nitelik — toplam savunma gücü */
export function calcArmyDefensePower(unitCounts, unitDefs = UNIT_MAP) {
  let power = 0;
  for (const [id, count] of Object.entries(unitCounts)) {
    const unit = unitDefs[id];
    if (unit) power += count * (unit.defense ?? 0);
  }
  return Math.round(power);
}

function armySnapshot(counts, unitDefs = UNIT_MAP) {
  return {
    counts: cloneCounts(counts),
    attackPower: calcArmyAttackPower(counts, unitDefs),
    defensePower: calcArmyDefensePower(counts, unitDefs),
    totalUnits: totalUnits(counts),
  };
}

function distributeCasualties(counts, damage, unitDefs = UNIT_MAP) {
  const losses = {};
  if (damage <= 0 || totalUnits(counts) < 1) {
    return { losses, remaining: cloneCounts(counts) };
  }

  const weights = {};
  let weightSum = 0;
  for (const [id, count] of Object.entries(counts)) {
    const unit = unitDefs[id];
    const w = count * ((unit?.defense ?? 1) + (unit?.attack ?? 0) * 0.35);
    weights[id] = w;
    weightSum += w;
  }

  if (weightSum < 1) {
    return { losses, remaining: cloneCounts(counts) };
  }

  let remainingDamage = damage;
  const remaining = cloneCounts(counts);

  for (const [id, count] of Object.entries(counts)) {
    const share = (weights[id] / weightSum) * damage;
    const rawLoss = Math.floor(share * CASUALTY_PER_DAMAGE + (remainingDamage > 0 ? 1 : 0));
    const lost = Math.min(count, Math.max(0, rawLoss));
    if (lost > 0) {
      losses[id] = (losses[id] || 0) + lost;
      remaining[id] = count - lost;
      if (remaining[id] <= 0) delete remaining[id];
    }
    remainingDamage = Math.max(0, remainingDamage - share);
  }

  return { losses, remaining };
}

function mergeLossMaps(...maps) {
  const merged = {};
  for (const map of maps) {
    for (const [id, n] of Object.entries(map || {})) {
      merged[id] = (merged[id] || 0) + n;
    }
  }
  return merged;
}

function resolvePenetratingDamage(attackPower, defensePower) {
  const absorbed = defensePower * ROUND_DEFENSE_ABSORB;
  return Math.max(0, Math.round(attackPower * ROUND_ATTACK_FACTOR - absorbed));
}

function runSingleRound(roundIndex, attacker, defender, unitDefs, attackerTacticalMult = 1) {
  const atkSnap = armySnapshot(attacker, unitDefs);
  const defSnap = armySnapshot(defender, unitDefs);

  const atkPower = Math.round(atkSnap.attackPower * Math.max(1, attackerTacticalMult));
  const damageToDefender = resolvePenetratingDamage(atkPower, defSnap.defensePower);
  const damageToAttacker = resolvePenetratingDamage(defSnap.attackPower, atkSnap.defensePower);

  const defResult = distributeCasualties(defender, damageToDefender, unitDefs);
  const atkResult = distributeCasualties(attacker, damageToAttacker, unitDefs);

  return {
    round: roundIndex + 1,
    attackerAttack: atkSnap.attackPower,
    attackerDefense: atkSnap.defensePower,
    defenderAttack: defSnap.attackPower,
    defenderDefense: defSnap.defensePower,
    damageToDefender,
    damageToAttacker,
    attackerLosses: atkResult.losses,
    defenderLosses: defResult.losses,
    attackerRemaining: atkResult.remaining,
    defenderRemaining: defResult.remaining,
  };
}

function pickWinner(attacker, defender, unitDefs) {
  const atkUnits = totalUnits(attacker);
  const defUnits = totalUnits(defender);
  if (defUnits < 1 && atkUnits > 0) return 'attacker';
  if (atkUnits < 1) return 'defender';

  const atkScore = calcArmyAttackPower(attacker, unitDefs) + calcArmyDefensePower(attacker, unitDefs) * 0.6;
  const defScore = calcArmyAttackPower(defender, unitDefs) + calcArmyDefensePower(defender, unitDefs) * 0.6;
  if (atkScore === defScore) return atkScore >= defScore ? 'attacker' : 'defender';
  return atkScore > defScore ? 'attacker' : 'defender';
}

/**
 * 3 turlu savaş simülasyonu.
 * @returns {object} Tam savaş sonucu
 */
export function runCombat(attackerCounts, defenderCounts, options = {}) {
  const unitDefs = options.unitDefs ?? UNIT_MAP;
  const roundsTotal = options.rounds ?? COMBAT_ROUNDS;
  const attackerTacticalMult = options.attackerTacticalMult ?? 1;

  let attacker = normalizeCounts(attackerCounts);
  let defender = normalizeCounts(defenderCounts);

  const initialAttacker = armySnapshot(attacker, unitDefs);
  const initialDefender = armySnapshot(defender, unitDefs);

  const rounds = [];
  let totalAttackerLosses = {};
  let totalDefenderLosses = {};

  for (let i = 0; i < roundsTotal; i += 1) {
    if (totalUnits(attacker) < 1 || totalUnits(defender) < 1) break;

    const round = runSingleRound(i, attacker, defender, unitDefs, attackerTacticalMult);
    rounds.push(round);

    totalAttackerLosses = mergeLossMaps(totalAttackerLosses, round.attackerLosses);
    totalDefenderLosses = mergeLossMaps(totalDefenderLosses, round.defenderLosses);

    attacker = round.attackerRemaining;
    defender = round.defenderRemaining;
  }

  const winner = pickWinner(attacker, defender, unitDefs);
  const attackerWon = winner === 'attacker';

  return {
    winner,
    attackerWon,
    rounds,
    initialAttacker,
    initialDefender,
    finalAttacker: armySnapshot(attacker, unitDefs),
    finalDefender: armySnapshot(defender, unitDefs),
    survivingAttacker: attacker,
    survivingDefender: defender,
    totalAttackerLosses,
    totalDefenderLosses,
  };
}

export function buildLossRowsFromCounts(sentCounts, lossMap, unitDefs = UNIT_MAP) {
  const rows = [];
  const sent = normalizeCounts(sentCounts);
  const allIds = new Set([...Object.keys(sent), ...Object.keys(lossMap || {})]);

  for (const id of allIds) {
    const unit = unitDefs[id];
    if (!unit) continue;
    const sentCount = sent[id] || 0;
    const lost = lossMap[id] || 0;
    if (sentCount <= 0 && lost <= 0) continue;
    rows.push({
      unitId: id,
      name: unit.name,
      icon: unit.image,
      sent: sentCount,
      lost: Math.min(sentCount, lost),
    });
  }

  return rows.sort((a, b) => b.lost - a.lost || b.sent - a.sent);
}

function formatLossSummary(rows) {
  const parts = rows.filter((r) => r.lost > 0).map((r) => `${r.lost} ${r.name}`);
  return parts.length ? parts.join(', ') : 'Kayıp yok';
}

/** Savunan üs deposundan %30 ganimet */
export function calcRaidLoot(defenderResources, rate = LOOT_RATE) {
  if (!defenderResources?.length) return [];

  return LOOT_RESOURCE_IDS.map((id) => {
    const res = defenderResources.find((r) => r.id === id);
    if (!res || res.current <= 0) return null;
    const amount = Math.floor(res.current * rate);
    if (amount < 1) return null;
    const meta = RESOURCE_META[id] ?? { label: id, icon: '◈' };
    return {
      id,
      icon: res.icon ?? meta.icon,
      label: res.label ?? meta.label,
      amount,
    };
  }).filter(Boolean);
}

/** Savunan şehir kaynaklarından ganimeti düş */
export function applyRaidToDefenderResources(defenderResources, lootItems) {
  if (!lootItems?.length) return defenderResources.map((r) => ({ ...r }));

  const lootById = Object.fromEntries(
    lootItems.map((l) => [l.id ?? LOOT_RESOURCE_IDS.find((rid) => RESOURCE_META[rid]?.label === l.label), l.amount]),
  );

  return defenderResources.map((r) => {
    const taken = lootById[r.id];
    if (!taken) return { ...r };
    return { ...r, current: Math.max(0, Math.floor(r.current - taken)) };
  });
}

/** Harita / casus verisinden savunan ordu */
export function resolveDefenderArmy(mapCity, options = {}) {
  const spyTroops = options.spyEnemyTroops;
  if (spyTroops && typeof spyTroops === 'object') {
    const counts = {};
    for (const [id, n] of Object.entries(spyTroops)) {
      const v = Math.floor(Number(n) || 0);
      if (v > 0) counts[id] = v;
    }
    if (totalUnits(counts) > 0) return counts;
  }

  if (!mapCity || mapCity.status === 'empty') {
    return { infantry: 40 + Math.floor(Math.random() * 80) };
  }

  const tier = inferCityTier(mapCity);
  const scale = tier === 'capital' ? 2.2 : tier === 'metropolis' ? 1.6 : tier === 'town' ? 1.1 : 0.85;
  const pop = mapCity.population || 1200;
  const base = Math.floor(pop / 120 * scale);

  return {
    infantry: Math.floor(base * 0.55),
    armor: Math.floor(base * 0.12),
    tank: Math.floor(base * 0.06),
    airdefense: Math.floor(base * 0.04),
    sniper: Math.floor(base * 0.05),
  };
}

/** Bot / harita hedefi için sentetik depo */
export function resolveDefenderDepot(mapCity) {
  const tier = mapCity ? inferCityTier(mapCity) : 'default';
  const mult = tier === 'capital' ? 2.5 : tier === 'metropolis' ? 1.8 : tier === 'town' ? 1.2 : 0.7;
  const pop = mapCity?.population || 800;
  const base = Math.floor(pop * 1.8 * mult);

  return [
    { id: 'food', label: 'Nüfus', icon: '👥', current: Math.floor(base * 0.35), max: null },
    { id: 'fuel', label: 'Petrol', icon: '🛢️', current: Math.floor(base * 0.2), max: null },
    { id: 'hammadde', label: 'Hammadde', icon: '🧱', current: Math.floor(base * 0.28), max: null },
    { id: 'money', label: 'Bütçe', icon: '💰', current: Math.floor(base * 0.22), max: null },
    { id: 'energy', label: 'Enerji', icon: '⚡', current: Math.floor(base * 0.08), max: null },
  ];
}

function buildCombatLedgerLines(combat, loot) {
  const status = combat.attackerWon ? 'WIN' : 'LOSS';
  const lines = [
    `[ COMBAT LEDGER ]: ${status}`,
    `TUR: ${combat.rounds.length}/${COMBAT_ROUNDS} · SALDIRAN ATK ${combat.initialAttacker.attackPower} / DEF ${combat.initialAttacker.defensePower}`,
    `SAVUNAN ATK ${combat.initialDefender.attackPower} / DEF ${combat.initialDefender.defensePower}`,
  ];

  combat.rounds.forEach((r) => {
    lines.push(
      `R${r.round}: →Düşman ${r.damageToDefender} hasar | →Biz ${r.damageToAttacker} hasar`,
    );
  });

  if (loot?.length) {
    lines.push(`GANİMET: ${loot.map((l) => `${l.amount} ${l.label}`).join(', ')}`);
  } else if (combat.attackerWon) {
    lines.push('GANİMET: depo boş');
  }

  return lines;
}

/**
 * Raporlar sekmesi için savaş raporu nesnesi.
 */
export function buildCombatReport({
  expedition,
  combat,
  loot = [],
  attackerName = 'Komutan',
  defenderName,
}) {
  const target = expedition.target;
  const sentPayload = expedition.troopPayload && !expedition.troopPayload.spies
    ? expedition.troopPayload
    : null;

  const attackerLossRows = buildLossRowsFromCounts(
    sentPayload,
    combat.totalAttackerLosses,
  );
  const defenderLossRows = buildLossRowsFromCounts(
    combat.initialDefender.counts,
    combat.totalDefenderLosses,
  );

  const won = combat.attackerWon;
  const ledgerLines = buildCombatLedgerLines(combat, loot);

  return {
    id: genId('r'),
    filterType: 'battle',
    type: 'Savaş',
    title: `${target} — Saldırı Raporu`,
    date: nowReportDate(),
    preview: won
      ? `[ COMBAT LEDGER ]: WIN — ${loot.length ? 'Ganimet yağmalandı' : 'Zafer'}`
      : '[ COMBAT LEDGER ]: LOSS — Birlikler geri çekildi',
    winner: won ? 'player' : 'enemy',
    attacker: attackerName,
    defender: defenderName ?? target,
    attackerLosses: formatLossSummary(attackerLossRows),
    defenderLosses: formatLossSummary(defenderLossRows) || (won ? 'Garnizon imha' : '—'),
    attackerLossRows,
    defenderLossRows,
    troopPayload: sentPayload,
    survivingPayload: combat.survivingAttacker,
    originCityId: expedition.originCityId,
    loot,
    combatLedger: {
      status: won ? 'WIN' : 'LOSS',
      rounds: combat.rounds,
      initialAttacker: combat.initialAttacker,
      initialDefender: combat.initialDefender,
      finalAttacker: combat.finalAttacker,
      finalDefender: combat.finalDefender,
      lines: ledgerLines,
    },
    isNew: true,
  };
}

/** UI önizleme — mevcut battleSimulator uyumluluğu */
export function simulateBattle(attackerCounts, defenderCounts) {
  const combat = runCombat(attackerCounts, defenderCounts);
  const totalAtk = totalUnits(normalizeCounts(attackerCounts));
  const totalDef = totalUnits(normalizeCounts(defenderCounts));

  if (totalAtk < 1) {
    return {
      attackerPower: 0,
      defenderPower: combat.initialDefender.defensePower,
      winProbability: 0,
      outcome: 'invalid',
      outcomeLabel: 'Saldırı birliği girin',
      attackerLossPct: 0,
      defenderLossPct: 0,
      combat,
    };
  }

  if (totalDef < 1) {
    return {
      attackerPower: combat.initialAttacker.attackPower,
      defenderPower: 0,
      winProbability: 98,
      outcome: 'win',
      outcomeLabel: 'Zafer çok olası (boş garnizon)',
      attackerLossPct: 5,
      defenderLossPct: 100,
      combat,
    };
  }

  const atkScore = combat.initialAttacker.attackPower + combat.initialAttacker.defensePower * 0.5;
  const defScore = combat.initialDefender.attackPower + combat.initialDefender.defensePower * 0.5;
  const ratio = atkScore / Math.max(1, defScore);
  const winProbability = Math.round(
    Math.min(95, Math.max(5, (ratio / (ratio + 0.85)) * 100)),
  );

  const sent = normalizeCounts(attackerCounts);
  const lostTotal = Object.values(combat.totalAttackerLosses).reduce((a, b) => a + b, 0);
  const sentTotal = totalUnits(sent);
  const attackerLossPct = sentTotal > 0 ? Math.round((lostTotal / sentTotal) * 100) : 0;

  const defLost = Object.values(combat.totalDefenderLosses).reduce((a, b) => a + b, 0);
  const defSent = totalUnits(combat.initialDefender.counts);
  const defenderLossPct = defSent > 0 ? Math.round((defLost / defSent) * 100) : 0;

  let outcome;
  let outcomeLabel;
  if (combat.attackerWon) {
    outcome = 'win';
    outcomeLabel = 'Zafer olası (simülasyon)';
  } else if (winProbability >= 45) {
    outcome = 'uncertain';
    outcomeLabel = 'Belirsiz — kayıplar yüksek olabilir';
  } else {
    outcome = 'loss';
    outcomeLabel = 'Yenilgi riski yüksek';
  }

  return {
    attackerPower: combat.initialAttacker.attackPower,
    defenderPower: combat.initialDefender.defensePower,
    winProbability,
    outcome,
    outcomeLabel,
    attackerLossPct,
    defenderLossPct,
    combat,
  };
}
