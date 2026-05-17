/** Telif güvenli kod adları + askeri tip sınıflandırması (kart alt başlığı). */
export const UNIT_DISPLAY_BY_ID = {
  infantry: {
    name: "'Gölge' Operasyon Timi",
    designation: 'Light Infantry',
  },
  armor: {
    name: "'Karasu' Zırhlı Taşıyıcı",
    designation: 'Armored Personnel Carrier',
  },
  tank: {
    name: "'Pars' Ana Muharebe Tankı",
    designation: 'Main Battle Tank',
  },
  airdefense: {
    name: "'Kalkan-S' Savunma Kompleksi",
    designation: 'Air Defense Complex',
  },
  fighter: {
    name: "'Yıldırım-X' Çok Rollü Avcı",
    designation: 'Multi-role Fighter',
  },
  bomber: {
    name: "'Karayel' Stratejik Bombardıman",
    designation: 'Strategic Bomber',
  },
  drone: {
    name: "'Gözcü' Taktik Keşif İHA",
    designation: 'Tactical Reconnaissance UAV',
  },
  patrol: {
    name: "'Tayfun' Sınıfı Hücumbot",
    designation: 'Fast Attack Craft',
  },
  frigate: {
    name: "'Milgem-S' Sınıfı Fırkateyn",
    designation: 'Guided-Missile Frigate',
  },
  sub: {
    name: "'Girdap' Stratejik Denizaltı",
    designation: 'Strategic Submarine',
  },
};

/** Eski rapor / keşif metinleri için geriye dönük isim eşlemesi. */
export const LEGACY_UNIT_NAME_TO_ID = {
  piyade: 'infantry',
  'zırhlı araç': 'armor',
  zpt: 'armor',
  tank: 'tank',
  'hava savunma': 'airdefense',
  'savaş uçağı': 'fighter',
  bombardıman: 'bomber',
  drone: 'drone',
  iha: 'drone',
  hücumbot: 'patrol',
  firkateyn: 'frigate',
  fırkateyn: 'frigate',
  denizaltı: 'sub',
};

export function applyUnitDisplay(unit) {
  if (!unit?.id) return unit;
  const overlay = UNIT_DISPLAY_BY_ID[unit.id];
  if (!overlay) return unit;
  return { ...unit, name: overlay.name, designation: overlay.designation };
}

export function applyUnitDisplayList(units) {
  return (units ?? []).map(applyUnitDisplay);
}

export function getUnitDisplayName(unitId, fallback = '') {
  return UNIT_DISPLAY_BY_ID[unitId]?.name ?? fallback;
}
