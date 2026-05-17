/** Taktik bina kartı görselleri ve İngilizce teknik tanımlamalar. */
export const BUILDING_VISUALS = {
  barracks: {
    image: '/buildings/barracks.jpg',
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
    image: '/buildings/depot.jpg',
    designation: 'Secure Logistics Terminal',
  },
};

export function getBuildingVisual(buildingId) {
  return BUILDING_VISUALS[buildingId] ?? null;
}
