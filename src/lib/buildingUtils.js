import { buildings as buildingDefs } from '../data/placeholder';
import { getLevelOneSpec } from '../data/buildingCatalog';
import { getUnitDisplayName } from '../data/unitCatalog';

export const HQ_BUILDING_ID = 'hq';

export const MILITARY_BUILDING_IDS = ['barracks', 'airport', 'shipyard'];

export const PANEL_LOCKED_BUILDING_IDS = ['barracks', 'airport', 'shipyard'];

export const BUILDING_LABELS = {
  hq: 'Merkez Bina',
  barracks: 'Kışla',
  airport: 'Hava Üssü',
  shipyard: 'Tersane',
  research: 'Araştırma Merkezi',
  factory: 'Maden',
  depot: 'Depo',
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

export function createStarterBuildings() {
  return buildingDefs.map((b) => {
    const levelOne = getLevelOneSpec(b.id);
    return {
      ...b,
      level: 0,
      cost: levelOne?.cost ?? b.cost,
      time: levelOne?.time ?? b.time,
      upgrading: false,
      producing: false,
      locked: PANEL_LOCKED_BUILDING_IDS.includes(b.id),
      built: false,
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

export function getStarterResources() {
  return [
    { id: 'food', label: 'Yemek', icon: '🌾', current: 800, max: 5000, rate: '+0/sa' },
    { id: 'fuel', label: 'Yakıt', icon: '⛽', current: 400, max: 3000, rate: '+0/sa' },
    { id: 'metal', label: 'Metal', icon: '⚙️', current: 600, max: 4000, rate: '+0/sa' },
    { id: 'energy', label: 'Enerji', icon: '⚡', current: 200, max: null, rate: '+0/sa' },
    { id: 'money', label: 'Para', icon: '💰', current: 500, max: 8000, rate: '+0/sa' },
  ];
}

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
  return [
    { id: 'r1', name: 'Kara Saldırı Teknolojisi', level: 0, max: 15, desc: 'Kara birliklerine +%3 saldırı bonusu', active: false, queued: false, time: '04:22:15', cost: '2.800 metal · 1.200 para' },
    { id: 'r2', name: 'Üretim Hızı', level: 0, max: 15, desc: 'Tüm kaynak üretimine +%2 bonus', active: false, queued: false, time: '—', cost: '3.500 metal' },
    { id: 'r3', name: 'Casusluk Etkinliği', level: 0, max: 15, desc: 'Casus operasyonlarında başarı şansı', active: false, queued: false, time: '—', cost: '4.000 metal · 2.000 para' },
    { id: 'r4', name: 'Hava Savunma', level: 0, max: 15, desc: 'Hava saldırılarına karşı savunma', active: false, queued: false, time: '—', cost: '5.200 metal' },
  ];
}
