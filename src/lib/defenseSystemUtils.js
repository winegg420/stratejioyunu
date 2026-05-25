import { DEFENSE_MAX_LEVEL, DEFENSE_SYSTEMS } from '../data/defenseCatalog';
import { parseTimeToSeconds } from './gameUtils';

export function createDefaultDefenseInventory() {
  return Object.fromEntries(
    DEFENSE_SYSTEMS.map((d) => [d.id, { count: 0, level: 0 }]),
  );
}

export function normalizeCityDefense(city) {
  const base = createDefaultDefenseInventory();
  const raw = city?.defenseInventory ?? {};
  for (const sys of DEFENSE_SYSTEMS) {
    base[sys.id] = {
      count: Math.max(0, Number(raw[sys.id]?.count) || 0),
      level: Math.max(0, Number(raw[sys.id]?.level) || 0),
    };
  }
  return {
    defenseInventory: base,
    defenseQueue: Array.isArray(city?.defenseQueue) ? city.defenseQueue.map((q) => ({ ...q })) : [],
  };
}

/** Kademe maliyeti — seviye arttıkça +%12 */
export function scaleDefenseUpgradeCost(costStr, level = 0) {
  if (!costStr || costStr === '—') return '—';
  const mult = 1 + level * 0.12;
  return costStr.replace(/(\d[\d.]*)/g, (n) => String(Math.round(Number(n) * mult)));
}

export function getDefenseUnitDurationSeconds(def, count = 1) {
  const base = parseTimeToSeconds(def.unitTime) || 90;
  return Math.max(30, Math.round(base * count));
}

export function getDefenseUpgradeDurationSeconds(def, level = 0) {
  const base = parseTimeToSeconds(def.upgradeTime) || 600;
  return Math.max(60, Math.round(base * (1 + level * 0.08)));
}

export function isDefenseAtMaxLevel(level) {
  return (level ?? 0) >= DEFENSE_MAX_LEVEL;
}

export function getDefenseDisplayName(def, t) {
  if (typeof t === 'function') {
    const key = `defense.${def.id}.name`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return def.name;
}

export function getDefenseDescription(def, t) {
  if (typeof t === 'function') {
    const key = `defense.${def.id}.desc`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return def.desc;
}
