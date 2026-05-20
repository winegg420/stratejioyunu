import { landUnits } from '../data/placeholder';
import { inferCityTier } from '../map/cyberMapConfig';
import { genId, nowReportDate } from '../lib/gameUtils';
import {
  getKbrnDetectionLevel,
  shouldListKbrnProtocolsInIntel,
} from '../lib/kbrnResearch';
import {
  CYBER_OPS_BUILDING_ID,
  createCyberEffect,
  CYBER_VIRUS_DURATION_MS,
  getCyberAbilityById,
  getCyberOpsLevel,
} from '../lib/cyberOps';
import { formatCbrnProtocolFields } from './cbrnEngine';
import {
  getExpeditionDistanceKm,
  getMapMaxDistanceKm,
} from '../lib/expeditionTravel';
import {
  resolveDefenderArmy,
  resolveDefenderDepot,
  runCombat,
  buildCombatReport,
} from './combatEngine';

export const SPY_RESEARCH_ID = 'r3';
export const SPY_PROBE_MIN_SECONDS = 45;
export const SPY_PROBE_MAX_SECONDS = 4 * 3600;

/** Savunma yapıları — derinlik +2 raporunda gösterilir */
export const DEFENSE_BUILDING_IDS = ['wall', 'barracks', 'airport', 'shipyard', 'intel'];

const BUILDING_LABELS = {
  wall: 'Çevre Savunma Hattı',
  barracks: 'Kışla',
  airport: 'Hava Üssü',
  shipyard: 'Tersane',
  intel: 'İstihbarat Merkezi',
  cyber_ops: 'Siber Operasyon Merkezi',
  farm: 'Çiftlik',
  refinery: 'Rafineri',
  factory: 'Maden',
  depot: 'Depo',
  plant: 'Santral',
  tax: 'Vergi Binası',
  market: 'Pazar',
  research: 'Araştırma Merkezi',
  hq: 'Merkez Bina',
};

/**
 * Casusluk sondası süresi — mesafe (km) ve sonda sayısına göre geri sayım.
 * Daha fazla casus = biraz daha hızlı istihbarat ağı.
 */
export function calcSpyProbeTravelSeconds({
  origin,
  target,
  spyCount = 1,
  mapCities = [],
}) {
  const count = Math.max(1, Math.floor(Number(spyCount) || 1));

  if (!origin?.lat || !target?.lat) {
    return SPY_PROBE_MIN_SECONDS + count * 8;
  }

  const distKm = getExpeditionDistanceKm(origin, target);
  const maxKm = Math.max(1, getMapMaxDistanceKm(mapCities));
  const distanceRatio = Math.min(1, distKm / maxKm);

  const baseSeconds = SPY_PROBE_MIN_SECONDS + distanceRatio * (SPY_PROBE_MAX_SECONDS - SPY_PROBE_MIN_SECONDS);
  const networkBoost = 1 - Math.min(0.22, (count - 1) * 0.04);
  const probeSpeedFactor = 0.72;

  return Math.max(
    SPY_PROBE_MIN_SECONDS,
    Math.round(baseSeconds * networkBoost * probeSpeedFactor),
  );
}

/** Casusluk Teknolojisi (r3) + İstihbarat Merkezi katkısı */
export function getSpyTechnologyLevel({ researches = [], buildings = [] } = {}) {
  const research = researches.find((r) => r.id === SPY_RESEARCH_ID);
  const researchLevel = research?.level ?? 0;
  const intelBuilding = buildings.find((b) => b.id === 'intel');
  const intelLevel = intelBuilding?.level ?? 0;
  return researchLevel + Math.floor(intelLevel / 2);
}

/** Hedef üs / bot casusluk seviyesi */
export function resolveDefenderSpyLevel({ mapCity, defenderCity, defenderResearches = [] } = {}) {
  if (defenderCity?.buildings) {
    return getSpyTechnologyLevel({
      researches: defenderResearches,
      buildings: defenderCity.buildings,
    });
  }

  const tier = mapCity ? inferCityTier(mapCity) : 'default';
  const tierBase = tier === 'capital' ? 5 : tier === 'metropolis' ? 4 : tier === 'town' ? 3 : 2;
  const jitter = mapCity?.status === 'bot' ? 1 : 0;
  return tierBase + jitter;
}

/** Saldıran − savunan casusluk teknoloji farkı */
export function calcSpyTechDiff(attackerLevel, defenderLevel) {
  return (attackerLevel ?? 0) - (defenderLevel ?? 0);
}

export function resolveIntelDepth(techDiff) {
  if (techDiff <= 0) return 0;
  if (techDiff === 1) return 1;
  if (techDiff === 2) return 2;
  return 3;
}

function formatResourceFields(resources) {
  return (resources ?? [])
    .filter((r) => ['food', 'fuel', 'metal', 'money', 'energy'].includes(r.id))
    .map((r) => ({
      key: `res-${r.id}`,
      label: `${r.label} Deposu`,
      value: `${Math.floor(r.current).toLocaleString('tr-TR')}${r.max ? ` / ${Math.floor(r.max).toLocaleString('tr-TR')}` : ''}`,
      hidden: false,
      category: 'storage',
    }));
}

function formatDefenseBuildingFields(buildings) {
  return DEFENSE_BUILDING_IDS.map((id) => {
    const b = buildings?.find((x) => x.id === id);
    const level = b?.level ?? 0;
    return {
      key: `def-${id}`,
      label: BUILDING_LABELS[id] ?? id,
      value: level > 0 ? `Sv.${level}` : 'Yok',
      hidden: false,
      category: 'defense',
    };
  });
}

function formatAllBuildingFields(buildings) {
  return (buildings ?? []).map((b) => ({
    key: `bld-${b.id}`,
    label: b.name ?? BUILDING_LABELS[b.id] ?? b.id,
    value: `Sv.${b.level ?? 0}`,
    hidden: false,
    category: 'building',
  }));
}

function formatTroopFields(troops) {
  const rows = [];
  for (const unit of landUnits) {
    const n = troops?.[unit.id];
    if (!n || n <= 0) continue;
    rows.push({
      key: `troop-${unit.id}`,
      label: unit.name,
      value: Number(n).toLocaleString('tr-TR'),
      hidden: false,
      category: 'army',
    });
  }
  return rows;
}

function formatTechnologyFields(researches) {
  return (researches ?? []).map((r) => ({
    key: `tech-${r.id}`,
    label: r.name,
    value: `Sv.${r.level ?? 0} / ${r.max ?? 15}`,
    hidden: false,
    category: 'technology',
  }));
}

function buildIntelLedgerLines({
  status,
  techDiff,
  attackerLevel,
  defenderLevel,
  depth,
  target,
  fields,
}) {
  const lines = [
    `[ INTELLIGENCE REPORT ]: ${status}`,
    `HEDEF: ${target}`,
    `CASUS TEK: ATK ${attackerLevel} · DEF ${defenderLevel} · FARK ${techDiff >= 0 ? '+' : ''}${techDiff}`,
    `DERİNLİK: SEVİYE ${depth}`,
  ];

  const categories = {
    storage: 'HAM MADDE',
    defense: 'SAVUNMA YAPISI',
    building: 'BİNA',
    army: 'ORDU',
    technology: 'TEKNOLOJİ',
    kbrn: 'KBRN PROTOKOL',
  };

  for (const [cat, title] of Object.entries(categories)) {
    const group = fields.filter((f) => f.category === cat && !f.hidden);
    if (!group.length) continue;
    lines.push(`— ${title} —`);
    group.forEach((f) => lines.push(`${f.label}: ${f.value}`));
  }

  return lines;
}

function spiesToCombatPayload(spyCount) {
  const n = Math.max(1, Math.floor(spyCount) || 1);
  return { special: n * 2, sniper: Math.max(1, Math.floor(n / 2)) };
}

/**
 * Casusluk operasyonunu çöz — rapor + gerekirse savaş.
 */
export function resolveSpyMission({
  expedition,
  attackerContext,
  defenderContext,
  attackerName = 'Komutan',
}) {
  const spyCount = expedition.troopPayload?.spies ?? 0;
  const target = expedition.target;
  const mapCity = defenderContext.mapCity;

  const attackerLevel = getSpyTechnologyLevel({
    researches: attackerContext.researches,
    buildings: attackerContext.buildings,
  });
  const defenderLevel = resolveDefenderSpyLevel({
    mapCity,
    defenderCity: defenderContext.city,
    defenderResearches: defenderContext.researches,
  });

  const techDiff = calcSpyTechDiff(attackerLevel, defenderLevel);
  const depth = resolveIntelDepth(techDiff);

  const defenderResources = defenderContext.resources
    ?? resolveDefenderDepot(mapCity);
  const defenderBuildings = defenderContext.buildings
    ?? generateDefenderBuildings(mapCity);
  const defenderTroops = defenderContext.troops
    ?? resolveDefenderArmy(mapCity, { spyEnemyTroops: defenderContext.spyIntel });
  const defenderResearches = defenderContext.researches
    ?? generateBotResearches(mapCity);

  if (depth <= 0) {
    const combat = runCombat(
      spiesToCombatPayload(spyCount),
      defenderTroops,
    );
    const battleReport = buildCombatReport({
      expedition: {
        ...expedition,
        troopPayload: spiesToCombatPayload(spyCount),
        type: 'Sonda Çatışması',
      },
      combat,
      loot: [],
      attackerName,
      defenderName: mapCity?.owner || target,
    });

    const report = buildSpyIntelReport({
      expedition,
      depth: 0,
      techDiff,
      attackerLevel,
      defenderLevel,
      caught: true,
      intelFields: [],
      attackerName,
      defenderName: mapCity?.owner || target,
    });

    return {
      caught: true,
      techDiff,
      attackerLevel,
      defenderLevel,
      depth,
      report,
      combat,
      battleReport,
      spiesLost: spyCount,
      spiesReturned: 0,
    };
  }

  let intelFields = [];
  let status = 'PARTIAL';
  let preview = '';
  let findings = '';

  if (depth === 1) {
    status = 'STORAGE';
    intelFields = formatResourceFields(defenderResources);
    preview = 'Kısmi istihbarat — ham madde depoları sızdırıldı';
    findings = intelFields.map((f) => `${f.label}: ${f.value}`).join(' · ');
  } else if (depth === 2) {
    status = 'DEFENSE';
    intelFields = [
      ...formatResourceFields(defenderResources),
      ...formatDefenseBuildingFields(defenderBuildings),
    ];
    const detectLv = getKbrnDetectionLevel(attackerContext.researches);
    if (shouldListKbrnProtocolsInIntel(detectLv, depth)) {
      intelFields.push(...formatCbrnProtocolFields(defenderResearches));
    }
    preview = 'Gelişmiş istihbarat — depolar, savunma ve KBRN protokolleri';
    findings = 'Depo, savunma ve KBRN verileri kaydedildi';
  } else {
    status = 'FULL';
    intelFields = [
      ...formatResourceFields(defenderResources),
      ...formatAllBuildingFields(defenderBuildings),
      ...formatTroopFields(defenderTroops),
      ...formatTechnologyFields(defenderResearches),
    ];
    const detectLv = getKbrnDetectionLevel(attackerContext.researches);
    if (shouldListKbrnProtocolsInIntel(detectLv, depth)) {
      intelFields.push(...formatCbrnProtocolFields(defenderResearches));
    }
    preview = '[ INTELLIGENCE REPORT ] — Tam hedef profili';
    const troopSummary = formatTroopFields(defenderTroops)
      .map((f) => `${f.label} ${f.value}`)
      .join(' · ');
    findings = troopSummary || 'Tam istihbarat paketi alındı';
  }

  const report = buildSpyIntelReport({
    expedition,
    depth,
    techDiff,
    attackerLevel,
    defenderLevel,
    caught: false,
    intelFields,
    enemyTroops: depth >= 3 ? defenderTroops : undefined,
    attackerName,
    defenderName: mapCity?.owner || target,
    status,
    preview,
    findings,
  });

  return {
    caught: false,
    techDiff,
    attackerLevel,
    defenderLevel,
    depth,
    report,
    spiesLost: 0,
    spiesReturned: spyCount,
  };
}

export function buildSpyIntelReport({
  expedition,
  depth,
  techDiff,
  attackerLevel,
  defenderLevel,
  caught,
  intelFields = [],
  enemyTroops,
  attackerName,
  defenderName,
  status = caught ? 'BREACHED' : 'OK',
  preview,
  findings,
}) {
  const target = expedition.target;
  const success = !caught && depth > 0;

  const ledgerStatus = caught
    ? 'BREACHED'
    : depth >= 3
      ? 'FULL'
      : depth === 2
        ? 'DEFENSE'
        : depth === 1
          ? 'STORAGE'
          : 'NONE';

  const defaultPreview = caught
    ? 'Giriş Engellendi, Sonda Yakalandı'
    : preview ?? 'Casusluk verisi alındı';

  const intelLedger = {
    status: ledgerStatus,
    depth,
    techDiff,
    attackerLevel,
    defenderLevel,
    lines: buildIntelLedgerLines({
      status: ledgerStatus,
      techDiff,
      attackerLevel,
      defenderLevel,
      depth,
      target,
      fields: intelFields,
    }),
  };

  return {
    id: genId('r'),
    filterType: 'spy',
    type: 'Casusluk Sondası',
    title: `${target} — Casusluk Sondası`,
    date: nowReportDate(),
    preview: defaultPreview,
    winner: null,
    targetCity: target,
    intelSuccess: success,
    caught,
    triggersBattle: caught,
    intelDepth: depth,
    spyTechDiff: techDiff,
    attackerSpyLevel: attackerLevel,
    defenderSpyLevel: defenderLevel,
    intelFields,
    findings: caught
      ? 'Giriş Engellendi, Sonda Yakalandı — düşman garnizonu ile çatışma'
      : findings ?? defaultPreview,
    enemyTroops: success && depth >= 3 ? enemyTroops : {},
    attacker: attackerName,
    defender: defenderName ?? target,
    originCityId: expedition.originCityId,
    intelLedger,
    isNew: true,
  };
}

/** Bot hedef için sentetik bina listesi */
export function generateDefenderBuildings(mapCity) {
  const tier = mapCity ? inferCityTier(mapCity) : 'default';
  const scale = tier === 'capital' ? 1.4 : tier === 'metropolis' ? 1.15 : 1;

  return [
    { id: 'hq', name: 'Merkez Bina', level: Math.max(1, Math.floor(3 * scale)) },
    { id: 'farm', name: 'Çiftlik', level: Math.floor(6 * scale) },
    { id: 'factory', name: 'Maden', level: Math.floor(5 * scale) },
    { id: 'depot', name: 'Depo', level: Math.floor(4 * scale) },
    { id: 'barracks', name: 'Kışla', level: Math.floor(7 * scale) },
    { id: 'wall', name: 'Kale Duvarı', level: Math.floor(5 * scale) },
    { id: 'airport', name: 'Hava Üssü', level: Math.floor(3 * scale) },
    { id: 'intel', name: 'İstihbarat Merkezi', level: Math.floor(4 * scale) },
    { id: CYBER_OPS_BUILDING_ID, name: 'Siber Operasyon Merkezi', level: Math.floor(3 * scale) },
    { id: 'research', name: 'Araştırma Merkezi', level: Math.floor(4 * scale) },
  ];
}

// ——— Siber virüs / ajan operasyonları ———

export const CYBER_VIRUS_DEBUFF_RATIO = 0.3;

/**
 * Siber saldırı başarı ihtimali — saldıran cyber_ops vs savunan güvenlik duvarı.
 * Fark ≥3: kesin sızma; düşük/negatif fark: virüs temizlenme ihtimali yüksek.
 */
export function calcCyberAttackSuccessChance(attackerLevel, defenderLevel) {
  const diff = attackerLevel - defenderLevel;
  if (diff >= 3) return 1;
  if (diff === 2) return 0.92;
  if (diff === 1) return 0.76;
  if (diff === 0) return 0.52;
  if (diff === -1) return 0.26;
  if (diff === -2) return 0.1;
  return 0.05;
}

export function rollCyberAttackSuccess(attackerLevel, defenderLevel) {
  const diff = attackerLevel - defenderLevel;
  const chance = calcCyberAttackSuccessChance(attackerLevel, defenderLevel);
  const guaranteed = diff >= 3;
  const success = guaranteed || Math.random() < chance;
  return {
    success,
    chance,
    diff,
    attackerLevel,
    defenderLevel,
    guaranteed,
    virusCleansed: !success,
  };
}

export function resolveDefenderCyberOpsLevel({ mapCity, defenderCity } = {}) {
  if (defenderCity?.buildings) return getCyberOpsLevel(defenderCity);
  const buildings = generateDefenderBuildings(mapCity);
  const cyber = buildings.find((b) => b.id === CYBER_OPS_BUILDING_ID);
  return cyber?.level ?? 0;
}

/** Siber virüs konvoyu süresi — mesafe + ajan sayısı */
export function calcCyberVirusTravelSeconds({
  origin,
  target,
  agentCount = 1,
  mapCities = [],
}) {
  const base = calcSpyProbeTravelSeconds({
    origin,
    target,
    spyCount: agentCount,
    mapCities,
  });
  return Math.max(35, Math.round(base * 0.9));
}

function buildCyberLedgerLines({
  status,
  diff,
  attackerLevel,
  defenderLevel,
  chancePct,
  guaranteed,
  virusCleansed,
  target,
  abilityName,
  agentCount,
  durationHours,
}) {
  const lines = [
    '[ CYBER OPS LEDGER ]',
    `STATUS: ${status}`,
    `TARGET: ${target}`,
    `VECTOR: Siber Virüs/Ajan ×${agentCount}`,
    `OPERATION: ${abilityName}`,
    '---',
    `ATTACKER_FW: Lv.${attackerLevel}`,
    `DEFENDER_FW: Lv.${defenderLevel}`,
    `DELTA: ${diff >= 0 ? '+' : ''}${diff}`,
    `INTRUSION_CHANCE: ${chancePct}%${guaranteed ? ' (GUARANTEED)' : ''}`,
  ];
  if (status === 'SUCCESS') {
    lines.push(
      'PAYLOAD: DEPLOYED',
      `DEBUFF_WINDOW: ${durationHours}h @ -${Math.round(CYBER_VIRUS_DEBUFF_RATIO * 100)}%`,
    );
  } else if (virusCleansed) {
    lines.push('PAYLOAD: QUARANTINED — hedef güvenlik duvarı virüsü temizledi');
  } else {
    lines.push('PAYLOAD: BLOCKED — sızma başarısız');
  }
  lines.push(`TIMESTAMP: ${new Date().toISOString()}`);
  return lines;
}

export function buildCyberOpsReport({
  expedition,
  ability,
  roll,
  agentCount = 1,
  attackerName,
  defenderName,
  target,
}) {
  const status = roll.success ? 'SUCCESS' : 'FAILED';
  const chancePct = Math.round(roll.chance * 100);
  const durationHours = Math.round(CYBER_VIRUS_DURATION_MS / 3600000);

  const cyberLedger = {
    status,
    diff: roll.diff,
    attackerLevel: roll.attackerLevel,
    defenderLevel: roll.defenderLevel,
    chancePct,
    guaranteed: roll.guaranteed,
    virusCleansed: roll.virusCleansed,
    abilityId: ability?.id,
    abilityName: ability?.name ?? 'Siber Operasyon',
    agentCount,
    lines: buildCyberLedgerLines({
      status,
      diff: roll.diff,
      attackerLevel: roll.attackerLevel,
      defenderLevel: roll.defenderLevel,
      chancePct,
      guaranteed: roll.guaranteed,
      virusCleansed: roll.virusCleansed,
      target: target ?? expedition?.target,
      abilityName: ability?.name ?? 'Siber Operasyon',
      agentCount,
      durationHours,
    }),
  };

  const preview = `[ CYBER OPS LEDGER ]: ${status}`;
  const findings = roll.success
    ? `${ability?.name ?? 'Operasyon'} başarılı — hedefe ${durationHours} saatlik %${Math.round(CYBER_VIRUS_DEBUFF_RATIO * 100)} debuff`
    : roll.virusCleansed
      ? 'Güvenlik duvarı virüsü temizledi — ajan ağı geri çekildi'
      : 'Sızma engellendi — operasyon başarısız';

  return {
    id: genId('r'),
    filterType: 'cyber',
    type: 'Siber Virüs / Ajan',
    title: `${target ?? expedition?.target} — ${ability?.name ?? 'Siber Operasyon'}`,
    date: nowReportDate(),
    preview,
    winner: roll.success ? attackerName : defenderName ?? target,
    targetCity: target ?? expedition?.target,
    cyberSuccess: roll.success,
    cyberLedger,
    findings,
    attacker: attackerName,
    defender: defenderName ?? target,
    originCityId: expedition?.originCityId,
    isNew: true,
  };
}

/**
 * Siber virüs seferi tamamlandığında — başarı zarı, rapor ve (oyuncu hedefinde) debuff.
 */
export function resolveCyberVirusMission({
  expedition,
  attackerCity,
  defenderCity,
  mapCity,
  abilityId,
  agentCount = 1,
  attackerName,
}) {
  const ability = getCyberAbilityById(abilityId);
  const count = Math.max(1, Math.floor(Number(agentCount) || 1));
  const attackerLevel = getCyberOpsLevel(attackerCity);
  const defenderLevel = resolveDefenderCyberOpsLevel({ mapCity, defenderCity });
  const roll = rollCyberAttackSuccess(attackerLevel, defenderLevel);
  const target = expedition?.target ?? mapCity?.name;

  const report = buildCyberOpsReport({
    expedition,
    ability,
    roll,
    agentCount: count,
    attackerName,
    defenderName: mapCity?.owner || defenderCity?.name || target,
    target,
  });

  let effect = null;
  if (roll.success && ability) {
    effect = createCyberEffect(ability, {
      sourceCityName: expedition?.originCityName ?? attackerName,
      sourcePlayer: attackerName,
    });
  }

  return {
    success: roll.success,
    roll,
    report,
    effect,
    agentsReturned: roll.success ? count : 0,
    agentsLost: roll.success ? 0 : count,
  };
}

export function generateBotResearches(mapCity) {
  const tier = mapCity ? inferCityTier(mapCity) : 'default';
  const base = tier === 'capital' ? 4 : tier === 'metropolis' ? 3 : 2;

  return [
    { id: 'r1', name: 'Kara Saldırı Teknolojisi', level: base, max: 15 },
    { id: 'r2', name: 'Üretim Hızı', level: base - 1, max: 15 },
    { id: 'r3', name: 'Casusluk Etkinliği', level: base + 1, max: 15 },
    { id: 'r4', name: 'Hava Savunma', level: base, max: 15 },
    ...generateBotKbrnResearches(mapCity),
  ];
}

export function generateBotKbrnResearches(mapCity) {
  const tier = mapCity ? inferCityTier(mapCity) : 'default';
  const base = tier === 'capital' ? 3 : tier === 'metropolis' ? 2 : 1;

  return [
    { id: 'kbrn_weapon', name: 'KBRN Silahı', level: base, max: 10 },
    { id: 'kbrn_decon', name: 'Dekontaminasyon', level: Math.max(0, base - 1), max: 10 },
    { id: 'kbrn_detect', name: 'KBRN Tespit', level: base, max: 10 },
  ];
}
