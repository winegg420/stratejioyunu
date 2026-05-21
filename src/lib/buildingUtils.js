import { buildings as buildingDefs } from '../data/placeholder';
import { getLevelOneSpec } from '../data/buildingCatalog';
import { getUnitDisplayName } from '../data/unitCatalog';
import { createKbrnResearchTemplates } from './kbrnResearch';

export const HQ_BUILDING_ID = 'hq';

export const MILITARY_BUILDING_IDS = ['barracks', 'airport', 'shipyard'];

export const PANEL_LOCKED_BUILDING_IDS = ['barracks', 'airport', 'shipyard'];

export const BUILDING_LABELS = {
  hq: 'Komuta Merkezi',
  barracks: 'Kışla',
  airport: 'Hava Üssü',
  shipyard: 'Deniz Üssü',
  research: 'Ar-Ge Merkezi',
  factory: 'Endüstri Kompleksi',
  depot: 'Lojistik Depo',
  cyber_ops: 'Siber Operasyon Merkezi',
  wall: 'Çevre Savunma Hattı',
  intel: 'İstihbarat Merkezi',
  tax: 'Maliye Dairesi',
};

export const RESEARCH_BUILDING_ID = 'research';

/** Seviye 1 inşaatı için gerekli diğer bina seviyeleri */
export function getHqLevel(city) {
  const hq = city?.buildings?.find((b) => b.id === HQ_BUILDING_ID);
  return hq?.level ?? 0;
}

export const BUILDING_PREREQUISITES = {
  farm: [{ id: HQ_BUILDING_ID, level: 1 }],
  refinery: [{ id: 'farm', level: 1 }],
  factory: [{ id: 'farm', level: 2 }],
  plant: [{ id: 'factory', level: 1 }],
  tax: [{ id: 'farm', level: 1 }],
  barracks: [{ id: 'farm', level: 1 }, { id: 'factory', level: 1 }],
  airport: [{ id: 'barracks', level: 3 }, { id: 'factory', level: 4 }],
  shipyard: [{ id: 'barracks', level: 2 }, { id: 'factory', level: 2 }],
  intel: [{ id: 'barracks', level: 2 }],
  wall: [{ id: 'barracks', level: 1 }],
  market: [{ id: 'tax', level: 2 }],
  research: [{ id: 'factory', level: 3 }, { id: 'market', level: 1 }],
  depot: [{ id: 'factory', level: 2 }],
  cyber_ops: [{ id: 'intel', level: 2 }, { id: 'research', level: 2 }],
};

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

export function createStarterBuildings({ useDemoLevels = false } = {}) {
  return buildingDefs.map((b) => {
    const levelOne = getLevelOneSpec(b.id);
    const demoLevel = useDemoLevels ? Math.max(0, b.level ?? 0) : 0;
    const level = useDemoLevels
      ? (b.id === HQ_BUILDING_ID ? Math.max(1, demoLevel) : demoLevel)
      : (b.id === HQ_BUILDING_ID ? 1 : 0);
    return {
      ...b,
      level,
      cost: levelOne?.cost ?? b.cost,
      time: levelOne?.time ?? b.time,
      upgrading: false,
      producing: false,
      locked: level < 1 && PANEL_LOCKED_BUILDING_IDS.includes(b.id),
      built: level > 0,
    };
  });
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
  return [
    { id: 'infantry', name: getUnitDisplayName('infantry', 'Piyade'), icon: '🪖', available: 0 },
    { id: 'armor', name: getUnitDisplayName('armor', 'Zırhlı Araç'), icon: '🚛', available: 0 },
    { id: 'tank', name: getUnitDisplayName('tank', 'Tank'), icon: '🛡️', available: 0 },
    { id: 'airdefense', name: getUnitDisplayName('airdefense', 'Hava Savunma'), icon: '📡', available: 0 },
    { id: 'sniper', name: 'Keskin Nişancı', icon: '🎯', available: 0 },
    { id: 'special', name: 'Özel Tim', icon: '⚔️', available: 0 },
    { id: 'colonist', name: 'Göçmen / İnşaat Aracı', icon: '🏙️', available: 0 },
  ];
}

export function createStarterResearches() {
  const standard = [
    { id: 'r1', category: 'standard', name: 'Kara Saldırı Teknolojisi', level: 0, max: 15, desc: 'Kara birliklerine +%3 saldırı bonusu', active: false, queued: false, time: '04:22:15', cost: '2.800 metal · 1.200 bütçe' },
    { id: 'r2', category: 'standard', name: 'Üretim Hızı', level: 0, max: 15, desc: 'Tüm kaynak üretimine +%2 bonus', active: false, queued: false, time: '—', cost: '3.500 metal' },
    { id: 'r3', category: 'standard', name: 'Casusluk Etkinliği', level: 0, max: 15, desc: 'Casus operasyonlarında başarı şansı', active: false, queued: false, time: '—', cost: '4.000 metal · 2.000 bütçe' },
    { id: 'r4', category: 'standard', name: 'Hava Savunma', level: 0, max: 15, desc: 'Hava saldırılarına karşı savunma', active: false, queued: false, time: '—', cost: '5.200 metal' },
  ];
  return [...standard, ...createKbrnResearchTemplates()];
}
