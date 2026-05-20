/** Günümüz askeri birim kod adları + tip sınıflandırması. */
export const UNIT_DISPLAY_BY_ID = {
  infantry: {
    name: 'Piyade Taburu',
    designation: 'Light Infantry Battalion',
    code: 'MIL-IN-01',
  },
  armor: {
    name: 'Zırhlı Personel Taşıyıcı',
    designation: 'Armored Personnel Carrier',
    code: 'MIL-APC-15',
  },
  tank: {
    name: 'Ana Muharebe Tankı',
    designation: 'Main Battle Tank',
    code: 'MIL-MBT-07',
  },
  airdefense: {
    name: 'Hava Savunma Bataryası',
    designation: 'Air Defense Battery',
    code: 'MIL-ADS-04',
  },
  sniper: {
    name: 'Keskin Nişancı Timi',
    designation: 'Designated Marksman Team',
    code: 'MIL-DMR-02',
  },
  special: {
    name: 'Özel Kuvvetler Timi',
    designation: 'Special Operations Forces',
    code: 'MIL-SOF-11',
  },
  colonist: {
    name: 'Üs Kurma Konvoyu',
    designation: 'Forward Operating Base Logistics',
    code: 'MIL-FOB-01',
  },
  fighter: {
    name: 'Çok Rollü Muharebe Uçağı',
    designation: 'Multi-role Fighter',
  },
  bomber: {
    name: 'Stratejik Bombardıman Uçağı',
    designation: 'Strategic Bomber',
  },
  drone: {
    name: 'Taktik Keşif İHA',
    designation: 'Tactical Reconnaissance UAV',
  },
  patrol: {
    name: 'Hücumbot',
    designation: 'Fast Attack Craft',
  },
  frigate: {
    name: 'Güdümlü Fırkateyn',
    designation: 'Guided-Missile Frigate',
  },
  sub: {
    name: 'Taarruz Denizaltısı',
    designation: 'Attack Submarine',
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
  'siber-gölge': 'infantry',
  'gölge operasyon': 'infantry',
};

export function applyUnitDisplay(unit) {
  if (!unit?.id) return unit;
  const overlay = UNIT_DISPLAY_BY_ID[unit.id];
  if (!overlay) return unit;
  return {
    ...unit,
    name: overlay.name,
    designation: overlay.designation,
    designationCode: overlay.code,
  };
}

export function applyUnitDisplayList(units) {
  return (units ?? []).map(applyUnitDisplay);
}

export function getUnitDisplayName(unitId, fallback = '') {
  return UNIT_DISPLAY_BY_ID[unitId]?.name ?? fallback;
}
