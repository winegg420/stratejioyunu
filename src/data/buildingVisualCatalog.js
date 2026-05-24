/** Taktik bina kartı görselleri — canlıda public/buildings yolları (deploy güvenli). */
export const BUILDING_ASSET_VERSION = '20260524a';

export const BUILDING_PLACEHOLDER_IMAGE = '/buildings/hq.jpg';

/** Tüm binalar — yedek görsel yolları */
export const BUILDING_IMAGE_PUBLIC_FALLBACK = {
  hq: '/buildings/komutamerkezi.png',
  refinery: '/buildings/refinery.jpg',
  plant: '/buildings/plant.jpg',
  barracks: '/buildings/barracks.jpg',
  airport: '/buildings/airport.jpg',
  shipyard: '/buildings/shipyard.jpg',
  research: '/buildings/argemerkezi.png',
  intel: '/buildings/intel.jpg',
  market: '/buildings/market.jpg',
  cyber_ops: '/buildings/intel.jpg',
  ai_center: '/buildings/ai-center.jpg',
};

/** Özel PNG/JPG kart görselleri — cache kırıcı sürüm ile */
export const CUSTOM_BUILDING_IMAGE_IDS = Object.keys(BUILDING_IMAGE_PUBLIC_FALLBACK);

const v = (path) => `${path}?v=${BUILDING_ASSET_VERSION}`;

export const BUILDING_VISUALS = {
  hq: {
    image: v('/buildings/komutamerkezi.png'),
    designation: 'Strategic Command Center',
  },
  refinery: {
    image: v('/buildings/refinery.jpg'),
    designation: 'Fuel & Raw Material Refinery',
  },
  plant: {
    image: v('/buildings/plant.jpg'),
    designation: 'Power Generation Grid',
  },
  cyber_ops: {
    image: v('/buildings/intel.jpg'),
    designation: 'Cyber Operations Command',
  },
  ai_center: {
    image: v('/buildings/ai-center.jpg'),
    designation: 'AI Command Center — Neural Warfare Core',
  },
  market: {
    image: v('/buildings/market.jpg'),
    designation: 'Trade Exchange Terminal',
  },
  intel: {
    image: v('/buildings/intel.jpg'),
    designation: 'Signals Intelligence Hub',
  },
  barracks: {
    image: v('/buildings/barracks.jpg'),
    designation: 'Reinforced Tactical Operations Center',
  },
  airport: {
    image: v('/buildings/airport.jpg'),
    designation: 'Hardened Aerial Dominance Complex',
  },
  shipyard: {
    image: v('/buildings/shipyard.jpg'),
    designation: 'Naval Fabrication Yard',
  },
  research: {
    image: v('/buildings/argemerkezi.png'),
    designation: 'Advanced Quantum Data Nexus',
  },
};

export function getBuildingVisual(buildingId) {
  const visual = BUILDING_VISUALS[buildingId];
  if (visual?.image) return visual;
  const fallback = BUILDING_IMAGE_PUBLIC_FALLBACK[buildingId];
  if (fallback) {
    return {
      image: v(fallback),
      designation: '',
    };
  }
  return {
    image: v(BUILDING_PLACEHOLDER_IMAGE),
    designation: '',
  };
}
