/** Taktik bina kartı görselleri — canlıda public/buildings JPG yolları (deploy güvenli). */
export const BUILDING_ASSET_VERSION = '20260524';

/** Özel PNG/JPG kart görselleri — cache kırıcı sürüm ile */
export const CUSTOM_BUILDING_IMAGE_IDS = ['barracks', 'shipyard', 'ai_center'];

/** @deprecated Yedek yollar — public/buildings ile aynı dosya */
export const BUILDING_IMAGE_PUBLIC_FALLBACK = {
  barracks: '/buildings/barracks.jpg',
  shipyard: '/buildings/shipyard.jpg',
  ai_center: '/buildings/ai-center.jpg',
};

const v = (path) => `${path}?v=${BUILDING_ASSET_VERSION}`;

export const BUILDING_VISUALS = {
  hq: {
    image: '/buildings/hq.jpg',
    designation: 'Strategic Command Center',
  },
  refinery: {
    image: '/buildings/refinery.jpg',
    designation: 'Fuel & Raw Material Refinery',
  },
  plant: {
    image: '/buildings/plant.jpg',
    designation: 'Power Generation Grid',
  },
  cyber_ops: {
    image: '/buildings/intel.jpg',
    designation: 'Cyber Operations Command',
  },
  ai_center: {
    image: v('/buildings/ai-center.jpg'),
    designation: 'AI Command Center — Neural Warfare Core',
  },
  market: {
    image: '/buildings/market.jpg',
    designation: 'Trade Exchange Terminal',
  },
  intel: {
    image: '/buildings/intel.jpg',
    designation: 'Signals Intelligence Hub',
  },
  barracks: {
    image: v('/buildings/barracks.jpg'),
    designation: 'Reinforced Tactical Operations Center',
  },
  airport: {
    image: '/buildings/airport.jpg',
    designation: 'Hardened Aerial Dominance Complex',
  },
  shipyard: {
    image: v('/buildings/shipyard.jpg'),
    designation: 'Naval Fabrication Yard',
  },
  research: {
    image: '/buildings/research.jpg',
    designation: 'Advanced Quantum Data Nexus',
  },
};

export function getBuildingVisual(buildingId) {
  return BUILDING_VISUALS[buildingId] ?? null;
}
