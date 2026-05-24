import { buildings as buildingDefs } from '../data/placeholder';
import { getLevelOneSpec } from '../data/buildingCatalog';
import { getUnitDisplayName } from '../data/unitCatalog';
import { createResearchTemplates } from '../data/researchCatalog';

export const HQ_BUILDING_ID = 'hq';

/** Oyundaki tek geçerli bina kimlikleri (11 adet). */
export const CANONICAL_BUILDING_IDS = [
  HQ_BUILDING_ID,
  'refinery',
  'plant',
  'barracks',
  'airport',
  'shipyard',
  'intel',
  'cyber_ops',
  'research',
  'ai_center',
  'market',
];

export const MILITARY_BUILDING_IDS = ['barracks', 'airport', 'shipyard'];

export const PANEL_LOCKED_BUILDING_IDS = ['barracks', 'airport', 'shipyard'];

export const BUILDING_LABELS = {
  hq: 'Komuta Merkezi',
  refinery: 'Yakıt Rafinerisi',
  plant: 'Enerji Santrali',
  barracks: 'Kara Kuvvetleri',
  airport: 'Hava Üssü',
  shipyard: 'Deniz Üssü',
  research: 'Ar-Ge Merkezi',
  cyber_ops: 'Siber Operasyon Merkezi',
  ai_center: 'Yapay Zeka Merkezi',
  intel: 'İstihbarat Merkezi',
  market: 'Ticaret Terminali',
};

export const RESEARCH_BUILDING_ID = 'research';

/** Seviye 1 inşaatı için gerekli diğer bina seviyeleri */
export function getHqLevel(city) {
  const hq = city?.buildings?.find((b) => b.id === HQ_BUILDING_ID);
  return hq?.level ?? 0;
}

export const BUILDING_PREREQUISITES = {
  refinery: [{ id: HQ_BUILDING_ID, level: 1 }],
  plant: [{ id: 'refinery', level: 1 }],
  barracks: [{ id: 'refinery', level: 1 }],
  airport: [{ id: 'barracks', level: 3 }, { id: 'plant', level: 2 }],
  shipyard: [{ id: 'barracks', level: 2 }, { id: 'refinery', level: 2 }],
  intel: [{ id: 'barracks', level: 2 }],
  market: [{ id: 'refinery', level: 2 }, { id: 'plant', level: 1 }],
  research: [{ id: 'refinery', level: 3 }, { id: 'market', level: 1 }],
  cyber_ops: [{ id: 'intel', level: 2 }, { id: 'research', level: 2 }],
  ai_center: [
    { id: 'research', level: 5 },
    { id: 'cyber_ops', level: 3 },
    { id: 'plant', level: 6 },
    { id: HQ_BUILDING_ID, level: 8 },
  ],
};

const defsById = () => Object.fromEntries(buildingDefs.map((b) => [b.id, b]));

/** Kayıtlı şehir binalarını 11’lik katalogla hizalar; kaldırılan ID’leri atar. */
export function syncCityBuildingsToCatalog(buildings = [], { useDemoLevels = false } = {}) {
  const allowed = new Set(CANONICAL_BUILDING_IDS);
  const defs = defsById();
  const existing = new Map();
  for (const b of buildings) {
    if (b?.id && allowed.has(b.id)) existing.set(b.id, b);
  }
  return CANONICAL_BUILDING_IDS.map((id) => {
    const def = defs[id];
    const prev = existing.get(id);
    const levelOne = getLevelOneSpec(id);
    const demoLevel = useDemoLevels ? Math.max(0, def?.level ?? 0) : 0;
    const level = prev != null
      ? (prev.level ?? 0)
      : (useDemoLevels
        ? (id === HQ_BUILDING_ID ? Math.max(1, demoLevel) : demoLevel)
        : (id === HQ_BUILDING_ID ? 1 : 0));
    const base = {
      ...def,
      level,
      cost: (levelOne?.cost && levelOne.cost !== '—')
        ? levelOne.cost
        : (def?.cost && def.cost !== '—' ? def.cost : levelOne?.cost ?? def?.cost),
      time: (levelOne?.time && levelOne.time !== '—')
        ? levelOne.time
        : (def?.time && def.time !== '—' ? def.time : levelOne?.time ?? def?.time),
      upgrading: prev?.upgrading ?? false,
      producing: prev?.producing ?? false,
      locked: level < 1 && PANEL_LOCKED_BUILDING_IDS.includes(id),
      built: level > 0,
    };
    if (!prev) return base;
    return { ...base, ...prev, id, name: def.name, desc: def.desc, category: def.category, image: def.image };
  });
}

export function getBuildingPrerequisites(buildingId) {
  return BUILDING_PREREQUISITES[buildingId] ?? [];
}

export function getUnmetPrerequisites(city, buildingId) {
  const reqs = getBuildingPrerequisites(buildingId);
  if (!city?.buildings) return reqs;
  return reqs.filter((req) => {
    const b = city.buildings.find((x) => x.id === req.id);
    return !b || (b.level ?? 0) < req.level;
  });
}

export function arePrerequisitesMet(city, buildingId) {
  return getUnmetPrerequisites(city, buildingId).length === 0;
}

export function formatPrerequisiteList(unmet) {
  if (!unmet.length) return 'Ön koşul yok';
  return unmet
    .map((req) => `${BUILDING_LABELS[req.id] ?? req.id} Sv.${req.level}`)
    .join(' · ');
}

/**
 * Yeni oyun: yalnızca Komuta Merkezi Sv.1, diğer binalar Sv.0.
 * placeholder.js içindeki level değerleri UI örneğidir; oyun durumuna kopyalanmaz.
 */
export function createStarterBuildings({ useDemoLevels = false } = {}) {
  if (useDemoLevels) {
    return syncCityBuildingsToCatalog([], { useDemoLevels: true });
  }
  return syncCityBuildingsToCatalog(
    [{ id: HQ_BUILDING_ID, level: 1, built: true, upgrading: false }],
    { useDemoLevels: false },
  );
}

export function isBuildingBuilt(building) {
  return (building.level ?? 0) > 0 || building.built === true;
}

export function isBuildingLocked(building) {
  return !isBuildingBuilt(building);
}

export function isMilitaryPanelLocked(city) {
  const barracks = city?.buildings?.find((b) => b.id === 'barracks');
  return !barracks || !isBuildingBuilt(barracks);
}

export function getBuildingById(city, buildingId) {
  return city?.buildings?.find((b) => b.id === buildingId);
}

export { getStarterResources, ensureCityResources, normalizeResourceRow } from '../data/resourceCatalog';

export function getStarterIdleTroops() {
  const land = [
    { id: 'infantry', name: getUnitDisplayName('infantry', 'Piyade'), icon: '🪖', available: 0 },
    { id: 'armor', name: getUnitDisplayName('armor', 'Zırhlı Araç'), icon: '🚛', available: 0 },
    { id: 'tank', name: getUnitDisplayName('tank', 'Tank'), icon: '🛡️', available: 0 },
    { id: 'airdefense', name: getUnitDisplayName('airdefense', 'Hava Savunma'), icon: '📡', available: 0 },
    { id: 'sniper', name: 'Keskin Nişancı', icon: '🎯', available: 0 },
    { id: 'special', name: 'Özel Tim', icon: '⚔️', available: 0 },
    { id: 'colonist', name: 'Göçmen / İnşaat Aracı', icon: '🏙️', available: 0 },
  ];
  const air = ['scout', 'fighter', 'bomber', 'drone'].map((id) => ({
    id,
    name: getUnitDisplayName(id, id),
    icon: '✈️',
    available: 0,
  }));
  const sea = ['patrol', 'frigate', 'sub'].map((id) => ({
    id,
    name: getUnitDisplayName(id, id),
    icon: '⚓',
    available: 0,
  }));
  return [...land, ...air, ...sea];
}

/** React 19 useSyncExternalStore — aynı içerik için aynı dizi referansı. */
let mergeIdleTroopsInputRef = null;
let mergeIdleTroopsContentKey = '';
let mergeIdleTroopsResult = null;

function idleTroopsContentKey(src) {
  if (!src?.length) return 'empty';
  return src.map((t) => `${t.id}:${t.available ?? t.count ?? 0}`).join('|');
}

/** Mevcut şehir asker listesini kara/hava/deniz kataloğuyla hizalar. */
export function mergeCityIdleTroops(existing = []) {
  const src = existing ?? [];
  const contentKey = idleTroopsContentKey(src);
  if (contentKey === mergeIdleTroopsContentKey && mergeIdleTroopsResult) {
    return mergeIdleTroopsResult;
  }

  const byId = new Map(src.map((t) => [t.id, { ...t }]));
  for (const template of getStarterIdleTroops()) {
    const prev = byId.get(template.id);
    byId.set(template.id, prev
      ? { ...template, ...prev, name: template.name }
      : { ...template });
  }
  const merged = [...byId.values()];
  mergeIdleTroopsInputRef = src;
  mergeIdleTroopsContentKey = contentKey;
  mergeIdleTroopsResult = merged;
  return merged;
}

export function createStarterResearches() {
  return createResearchTemplates();
}

/** Tüm şehirlerin bina listesini 11’lik katalogla hizalar */
export function syncAllCityBuildings(cities = {}) {
  return Object.fromEntries(
    Object.entries(cities).map(([cityId, city]) => [
      cityId,
      {
        ...city,
        buildings: syncCityBuildingsToCatalog(city?.buildings ?? []),
      },
    ]),
  );
}
