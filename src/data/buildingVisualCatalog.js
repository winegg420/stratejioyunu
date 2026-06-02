/** Bina kartı — gradient placeholder (ekran görüntüsü / harici görsel yok) */

export const BUILDING_ASSET_VERSION = '20260527a';

export const BUILDING_PLACEHOLDER_IMAGE = null;

export const BUILDING_IMAGE_PUBLIC_FALLBACK = {};

export const CUSTOM_BUILDING_IMAGE_IDS = [];

export const BUILDING_VISUALS = {
  hq: { designation: 'Strategic Command Center' },
  refinery: { designation: 'Fuel & Raw Material Refinery' },
  plant: { designation: 'Power Generation Grid' },
  cyber_ops: { designation: 'Cyber Operations Command' },
  ai_center: { designation: 'AI Command Center — Neural Warfare Core' },
  market: { designation: 'Trade Exchange Terminal' },
  intel: { designation: 'Signals Intelligence Hub' },
  barracks: { designation: 'Reinforced Tactical Operations Center' },
  airport: { designation: 'Hardened Aerial Dominance Complex' },
  shipyard: { designation: 'Naval Fabrication Yard' },
  research: { designation: 'Advanced Quantum Data Nexus' },
};

export function getBuildingVisual(buildingId) {
  const visual = BUILDING_VISUALS[buildingId];
  return {
    image: null,
    designation: visual?.designation ?? '',
  };
}
