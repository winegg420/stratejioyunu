import { resolveNextConstructionSpec } from '../data/buildingCatalog';
import {
  BUILDING_ENCYCLOPEDIA,
  getBuildingPrereqTree,
  getProductionHourlyAtLevel,
  isProductionBuilding,
  RESEARCH_ENCYCLOPEDIA,
  RESEARCH_PREREQUISITES,
  UNIT_TACTICAL,
} from '../data/contentEncyclopedia';
import { UNIT_DISPLAY_BY_ID } from '../data/unitCatalog';
import { getBuildingVisual } from '../data/buildingVisualCatalog';
import {
  getResearchCenterLevel,
  isKbrnBranchUnlocked,
  KBRN_CATEGORY,
  KBRN_RESEARCH_CENTER_UNLOCK,
  scaleKbrnResearchCost,
} from './kbrnResearch';
import { BUILDING_LABELS } from './buildingUtils';
import { parseTimeToSeconds, formatSeconds } from './gameUtils';
import { parseUnitCost } from '../utils/resourceCosts';

const MAX_LEVEL_ROWS = 15;

function scaleResearchCost(baseCost, level) {
  if (!baseCost || baseCost === '—') return '—';
  const mult = 1 + Math.max(0, level) * 0.18;
  return baseCost
    .split('·')
    .map((part) => {
      const match = part.trim().match(/([\d.,]+)\s+(\S+)/);
      if (!match) return part.trim();
      const n = Number(match[1].replace(/\./g, '').replace(',', '.'));
      return `${Math.ceil(n * mult).toLocaleString('tr-TR')} ${match[2]}`;
    })
    .join(' · ');
}

function buildLevelRowsForBuilding(building) {
  const meta = BUILDING_ENCYCLOPEDIA[building.id];
  const rows = [];
  for (let lv = 1; lv <= MAX_LEVEL_ROWS; lv += 1) {
    const spec = resolveNextConstructionSpec({ ...building, level: lv - 1 });
    let output = '—';
    if (isProductionBuilding(building.id)) {
      output = `+${getProductionHourlyAtLevel(building.id, lv)}/sa`;
    } else if (meta?.perLevel) {
      output = meta.perLevel(lv);
    }
    rows.push({
      level: lv,
      output,
      cost: spec?.cost ?? '—',
      time: spec?.time ?? '—',
    });
  }
  return rows;
}

function buildLevelRowsForResearch(item) {
  const meta = RESEARCH_ENCYCLOPEDIA[item.id] ?? RESEARCH_ENCYCLOPEDIA.kbrn_chem;
  const rows = [];
  for (let lv = 1; lv <= Math.min(item.max ?? 15, MAX_LEVEL_ROWS); lv += 1) {
    const cost = item.category === KBRN_CATEGORY
      ? scaleKbrnResearchCost(item.cost, lv - 1)
      : scaleResearchCost(item.cost, lv - 1);
    const secs = parseTimeToSeconds(item.time);
    const time = secs ? formatSeconds(secs * (1 + (lv - 1) * 0.25)) : '—';
    rows.push({
      level: lv,
      output: meta?.perLevel ? meta.perLevel(lv) : '—',
      cost,
      time,
    });
  }
  return rows;
}

function buildPrereqLinesForResearch(item, city) {
  const kbrnReq = item.category === KBRN_CATEGORY
    ? RESEARCH_PREREQUISITES[item.id]
    : null;
  if (kbrnReq) {
    const rcLevel = getResearchCenterLevel(city);
    return kbrnReq.map((r) => ({
      met: rcLevel >= r.level,
      text: `${r.label} Sv.${r.level}+ (mevcut Sv.${rcLevel})`,
    }));
  }
  return [{ met: true, text: 'Standart askeri araştırma — ek bina koşulu yok' }];
}

function buildPrereqLinesForBuilding(building, city) {
  const tree = getBuildingPrereqTree(building.id);
  if (!tree.length) {
    return [{ met: true, text: 'Ön koşul yok — doğrudan inşa edilebilir' }];
  }
  return tree.map((req) => {
    const b = city?.buildings?.find((x) => x.id === req.id);
    const met = (b?.level ?? 0) >= req.level;
    return {
      met,
      text: `${req.label} Sv.${req.level}+ (mevcut Sv.${b?.level ?? 0})`,
    };
  });
}

export function resolveBuildingInfoPayload(building, city) {
  const visual = getBuildingVisual(building.id);
  const meta = BUILDING_ENCYCLOPEDIA[building.id];
  const nextSpec = resolveNextConstructionSpec(building);

  return {
    kind: 'building',
    id: building.id,
    title: building.name,
    category: building.category,
    subtitle: visual?.designation ?? building.category,
    image: visual?.image,
    emoji: building.image,
    lore: meta?.lore ?? building.desc,
    currentLevel: building.level ?? 0,
    effectLabel: meta?.effectLabel ?? 'Etki',
    levelRows: buildLevelRowsForBuilding(building),
    prerequisites: buildPrereqLinesForBuilding(building, city),
    nextCost: nextSpec?.cost ?? null,
    nextTime: nextSpec?.time ?? null,
  };
}

export function resolveResearchInfoPayload(item, city) {
  const meta = RESEARCH_ENCYCLOPEDIA[item.id] ?? RESEARCH_ENCYCLOPEDIA.kbrn_chem;
  const kbrnLocked = item.category === KBRN_CATEGORY && !isKbrnBranchUnlocked(city);

  return {
    kind: 'research',
    id: item.id,
    title: item.name,
    category: item.category === KBRN_CATEGORY ? 'KBRN' : 'Araştırma',
    subtitle: `Sv. ${item.level ?? 0} / ${item.max ?? 15}`,
    emoji: item.category === KBRN_CATEGORY ? '☢️' : '🔬',
    lore: meta?.lore ?? item.desc,
    currentLevel: item.level ?? 0,
    maxLevel: item.max ?? 15,
    effectLabel: meta?.effectLabel ?? 'Bonus',
    levelRows: buildLevelRowsForResearch(item),
    prerequisites: buildPrereqLinesForResearch(item, city),
    kbrnLocked,
    kbrnGate: `Ar-Ge Merkezi Sv.${KBRN_RESEARCH_CENTER_UNLOCK}+ gerekli`,
  };
}

export function resolveUnitInfoPayload(unit) {
  const display = UNIT_DISPLAY_BY_ID[unit.id];
  const tactical = UNIT_TACTICAL[unit.id] ?? {
    speed: 5,
    cargo: 100,
    fuelPerSortie: 10,
    advantages: [],
    disadvantages: [],
  };

  const costParts = parseUnitCost(unit.cost);
  const fuelLine = costParts.find((c) => c.resourceId === 'fuel');

  return {
    kind: 'unit',
    id: unit.id,
    title: unit.name,
    subtitle: display?.code ?? display?.designation ?? unit.designationCode ?? '',
    designation: display?.designation ?? unit.designation,
    milCode: display?.code ?? unit.designationCode ?? `MIL-${unit.id.toUpperCase()}`,
    emoji: unit.image,
    lore: unit.desc,
    attack: unit.attack,
    defense: unit.defense,
    cost: unit.cost,
    time: unit.time,
    speed: tactical.speed,
    cargo: tactical.cargo,
    fuelPerSortie: fuelLine?.amount ?? tactical.fuelPerSortie,
    advantages: tactical.advantages ?? [],
    disadvantages: tactical.disadvantages ?? [],
  };
}
