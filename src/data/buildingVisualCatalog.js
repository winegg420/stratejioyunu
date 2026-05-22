/** Taktik bina kartı görselleri — canlıda public/buildings JPG yolları (deploy güvenli). */
export const BUILDING_ASSET_VERSION = '20260522';

/** @deprecated Yedek yollar — barracks.jpg / depot.jpg ile aynı dosya */
export const BUILDING_IMAGE_PUBLIC_FALLBACK = {
  barracks: '/buildings/barracks.jpg',
  depot: '/buildings/depot.jpg',
};

const v = (path) => `${path}?v=${BUILDING_ASSET_VERSION}`;

export const BUILDING_VISUALS = {
  hq: {
    image: '/buildings/hq.jpg',
    designation: 'Strategic Command Center',
  },
  farm: {
    image: '/buildings/farm.jpg',
    designation: 'Agricultural Production Complex',
  },
  refinery: {
    image: '/buildings/refinery.jpg',
    designation: 'Fuel Refinement Facility',
  },
  plant: {
    image: '/buildings/plant.jpg',
    designation: 'Power Generation Grid',
  },
  tax: {
    image: '/buildings/tax.jpg',
    designation: 'Fiscal Revenue Bureau',
  },
  wall: {
    image: '/buildings/wall.jpg',
    designation: 'Perimeter Defense Line',
  },
  cyber_ops: {
    image: '/buildings/intel.jpg',
    designation: 'Cyber Operations Command',
  },
  ai_center: {
    image: '/buildings/intel.jpg',
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
    image: '/buildings/shipyard.jpg',
    designation: 'Naval Fabrication Yard',
  },
  research: {
    image: '/buildings/research.jpg',
    designation: 'Advanced Quantum Data Nexus',
  },
  factory: {
    image: '/buildings/mine.jpg',
    designation: 'Geothermal/Mineral Extractor',
  },
  depot: {
    image: v('/buildings/depot.jpg'),
    designation: 'Secure Logistics Terminal',
  },
};

export function getBuildingVisual(buildingId) {
  return BUILDING_VISUALS[buildingId] ?? null;
}
