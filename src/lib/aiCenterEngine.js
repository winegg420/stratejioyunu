/**
 * Yapay Zeka Merkezi (AI Command Center) — enerji tüketimi, seviye bonusları, siber yarış.
 */
import { pruneCyberEffects } from './happinessSystem';
import { getBuildingById } from './buildingUtils';
import { ratePerSecond } from './gameUtils';

export const AI_CENTER_BUILDING_ID = 'ai_center';
export const AI_CENTER_MAX_LEVEL = 15;
export const AI_CENTER_ENERGY_PER_LEVEL_HOURLY = 50;
export const AI_EARLY_WARNING_MS = 60 * 60 * 1000;

const MINE_RESOURCE_IDS = new Set(['food', 'hammadde', 'fuel']);
const DEPOT_RESOURCE_IDS = new Set(['food', 'hammadde', 'fuel', 'money', 'energy', 'uranium']);

export function getAiCenterLevel(city) {
  const b = getBuildingById(city, AI_CENTER_BUILDING_ID);
  return Math.min(AI_CENTER_MAX_LEVEL, b?.level ?? 0);
}

export function getAiCenterEnergyDemandHourly(level) {
  const lv = Math.max(0, Math.floor(level) || 0);
  if (lv < 1) return 0;
  return lv * AI_CENTER_ENERGY_PER_LEVEL_HOURLY;
}

export function isAiCenterSabotaged(city, now = Date.now()) {
  return pruneCyberEffects(city?.cyberEffects).some((fx) => fx.aiCenterOffline);
}

/** YZ çevrimiçi: bina var, sabote değil, enerji yeterli */
export function isAiCenterOperational(city, now = Date.now()) {
  const level = getAiCenterLevel(city);
  if (level < 1) return false;
  if (isAiCenterSabotaged(city, now)) return false;
  const demand = getAiCenterEnergyDemandHourly(level);
  const energy = city?.resources?.find((r) => r.id === 'energy');
  return (energy?.current ?? 0) >= demand;
}

export function getAiBonuses(city, now = Date.now()) {
  const level = getAiCenterLevel(city);
  const active = isAiCenterOperational(city, now);
  if (!active || level < 1) {
    return {
      level,
      active: false,
      constructionSpeedMult: 1,
      militaryProductionMult: 1,
      mineProductionMult: 1,
      spySuccessBonus: 0,
      cyberPowerBonusPct: 0,
      travelSpeedMult: 1,
      autoResourceBalance: false,
      earlyWarning: false,
      combatTacticalMult: 1,
    };
  }

  return {
    level,
    active: true,
    constructionSpeedMult: level >= 1 ? 0.95 : 1,
    militaryProductionMult: level >= 2 ? 0.9 : 1,
    mineProductionMult: level >= 3 ? 1.08 : 1,
    spySuccessBonus: level >= 5 ? 3 : 0,
    cyberPowerBonusPct: level >= 7 ? 20 : 0,
    travelSpeedMult: level >= 9 ? 0.9 : 1,
    autoResourceBalance: level >= 10,
    earlyWarning: level >= 12,
    combatTacticalMult: level >= 15 ? 1.25 : 1,
  };
}

/** İki taraf YZ seviye farkı — siber şans ve delme */
export function getAiCyberArmsRaceBonus(attackerAiLevel, defenderAiLevel) {
  const diff = Math.max(0, Math.floor(attackerAiLevel) - Math.floor(defenderAiLevel));
  if (diff <= 0) return { levelDiff: diff, chanceBonusPct: 0, pierceBonusPct: 0 };
  return {
    levelDiff: diff,
    chanceBonusPct: diff * 4,
    pierceBonusPct: diff * 3,
  };
}

export function resolveDefenderAiLevel({ mapCity, defenderCity } = {}) {
  if (defenderCity?.buildings) {
    return isAiCenterOperational(defenderCity) ? getAiCenterLevel(defenderCity) : 0;
  }
  const tier = mapCity?.status === 'bot' ? 'bot' : 'default';
  if (tier === 'bot') {
    const name = mapCity?.name ?? '';
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Math.min(8, 2 + (hash % 6));
  }
  return 0;
}

export function applyConstructionDurationSeconds(seconds, city) {
  const { constructionSpeedMult } = getAiBonuses(city);
  return Math.max(5, Math.round(seconds * constructionSpeedMult));
}

export function applyMilitaryProductionDurationSeconds(seconds, city) {
  const { militaryProductionMult } = getAiBonuses(city);
  return Math.max(5, Math.round(seconds * militaryProductionMult));
}

export function applyExpeditionTravelSeconds(seconds, city) {
  const { travelSpeedMult } = getAiBonuses(city);
  return Math.max(10, Math.round(seconds * travelSpeedMult));
}

export function getAiSpyTechBonus(city) {
  return getAiBonuses(city).spySuccessBonus;
}

export function getAiCombatTacticalMult(city) {
  return getAiBonuses(city).combatTacticalMult;
}

export function getAiCyberPowerBonusPct(city) {
  return getAiBonuses(city).cyberPowerBonusPct;
}

/** Tick başına enerji tüketimi (saatlik talep / 3600 * saniye) */
export function applyAiCenterEnergyDrain(resources, city, elapsedSeconds = 1) {
  const level = getAiCenterLevel(city);
  if (level < 1 || isAiCenterSabotaged(city)) return resources;
  const hourly = getAiCenterEnergyDemandHourly(level);
  const drain = (hourly / 3600) * Math.max(0.1, elapsedSeconds);
  if (drain <= 0) return resources;

  return resources.map((r) => {
    if (r.id !== 'energy') return r;
    return { ...r, current: Math.max(0, Math.floor((r.current ?? 0) - drain)) };
  });
}

/** Sv.10+: dolu depodaki üretim akışını boş depolara yönlendir (tick) */
export function applyAiResourceAutoBalanceTick(resources, city, elapsedSeconds = 1) {
  const { autoResourceBalance } = getAiBonuses(city);
  if (!autoResourceBalance) return resources;

  const withDepot = resources.filter((r) => DEPOT_RESOURCE_IDS.has(r.id) && r.max != null);
  const full = withDepot.filter((r) => (r.current ?? 0) >= (r.max ?? 0));
  if (!full.length) return resources;

  const needy = withDepot.filter((r) => (r.current ?? 0) < (r.max ?? 0) * 0.92);
  if (!needy.length) return resources;

  const redirectTotal = full.reduce(
    (sum, r) => sum + ratePerSecond(r.rate) * Math.max(0.1, elapsedSeconds),
    0,
  );
  if (redirectTotal <= 0) return resources;

  const share = redirectTotal / needy.length;
  const needyIds = new Set(needy.map((r) => r.id));

  return resources.map((r) => {
    if (!needyIds.has(r.id) || r.max == null) return r;
    const next = Math.min(r.max, (r.current ?? 0) + share);
    return { ...r, current: Math.floor(next) };
  });
}

export function applyAiMineProductionMult(resources, city) {
  const { mineProductionMult } = getAiBonuses(city);
  if (mineProductionMult <= 1) return resources;
  return resources.map((r) => {
    if (!MINE_RESOURCE_IDS.has(r.id)) return r;
    const hourly = Math.floor(ratePerSecond(r.rate) * 3600 * mineProductionMult);
    return { ...r, rate: `+${hourly}/sa` };
  });
}

export function getEarlyWarningIncomingAttacks(incomingAttacks, playerCityIds, city, now = Date.now()) {
  const { earlyWarning } = getAiBonuses(city);
  if (!earlyWarning) return [];
  const ids = playerCityIds instanceof Set ? playerCityIds : new Set(playerCityIds);
  return (incomingAttacks ?? []).filter((a) => {
    if (!ids.has(a.targetCityId)) return false;
    if (a.endsAt == null) return false;
    const remaining = a.endsAt - now;
    return remaining > 0 && remaining <= AI_EARLY_WARNING_MS;
  });
}

export function formatAiCenterStatus(city) {
  const level = getAiCenterLevel(city);
  if (level < 1) return 'YZ Merkezi inşa edilmedi';
  if (isAiCenterSabotaged(city)) return 'YZ ağı sabote — tamir bekleniyor';
  if (!isAiCenterOperational(city)) {
    const demand = getAiCenterEnergyDemandHourly(level);
    return `Enerji yetersiz (gerekli: ${demand}/sa)`;
  }
  return `YZ Çevrimiçi · Sv.${level}`;
}

export const AI_CENTER_LEVEL_PERKS = [
  { level: 1, label: 'İnşaat süresi −%5' },
  { level: 2, label: 'Askeri üretim +%10 hız' },
  { level: 3, label: 'Maden üretimi +%8' },
  { level: 5, label: 'Casusluk başarısı +%15' },
  { level: 7, label: 'Siber güç +%20' },
  { level: 9, label: 'Sefer süresi −%10' },
  { level: 10, label: 'Otomatik kaynak dengesi' },
  { level: 12, label: 'Erken uyarı (1 saat)' },
  { level: 15, label: 'Savaş asistanı +%25 güç' },
];
