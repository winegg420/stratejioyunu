import { BUILDING_PREREQUISITES, BUILDING_LABELS } from '../lib/buildingUtils';
import { BUILDING_RESOURCE_MAP, BASE_HOURLY, HOURLY_PER_LEVEL } from '../lib/gameUtils';
import { KBRN_RESEARCH_IDS } from '../lib/kbrnResearch';

/** OGame tarzı birim taktik profilleri */
export const UNIT_TACTICAL = {
  infantry: {
    speed: 4,
    cargo: 120,
    fuelPerSortie: 8,
    advantages: [
      { targetId: 'sniper', pct: 85, label: 'MIL-DMR-02 Keskin Nişancı' },
      { targetId: 'scout', pct: 120, label: 'Keşif uçakları (sabit)' },
    ],
    disadvantages: [
      { targetId: 'armor', pct: 55, label: 'MIL-APC-15 Zırhlı Taşıyıcı' },
      { targetId: 'tank', pct: 40, label: 'MIL-MBT-07 Ana Muharebe Tankı' },
      { targetId: 'airdefense', pct: 50, label: 'MIL-ADS-04 Hava Savunma' },
    ],
  },
  armor: {
    speed: 6,
    cargo: 200,
    fuelPerSortie: 22,
    advantages: [
      { targetId: 'infantry', pct: 150, label: 'MIL-IN-01 Piyade Taburu' },
      { targetId: 'sniper', pct: 130, label: 'MIL-DMR-02 Keskin Nişancı' },
    ],
    disadvantages: [
      { targetId: 'tank', pct: 45, label: 'MIL-MBT-07 Ana Muharebe Tankı' },
      { targetId: 'fighter', pct: 60, label: 'Çok Rollü Muharebe Uçağı' },
    ],
  },
  tank: {
    speed: 5,
    cargo: 80,
    fuelPerSortie: 45,
    advantages: [
      { targetId: 'armor', pct: 155, label: 'MIL-APC-15 Zırhlı Taşıyıcı' },
      { targetId: 'infantry', pct: 140, label: 'MIL-IN-01 Piyade Taburu' },
      { targetId: 'airdefense', pct: 125, label: 'Sabit savunma bataryaları' },
    ],
    disadvantages: [
      { targetId: 'airdefense', pct: 50, label: 'MIL-ADS-04 (tam konumlanmış)' },
      { targetId: 'bomber', pct: 55, label: 'Stratejik Bombardıman' },
    ],
  },
  airdefense: {
    speed: 2,
    cargo: 40,
    fuelPerSortie: 35,
    advantages: [
      { targetId: 'fighter', pct: 150, label: 'Muharebe uçakları' },
      { targetId: 'bomber', pct: 165, label: 'Bombardıman filosu' },
      { targetId: 'drone', pct: 140, label: 'Taktik İHA' },
    ],
    disadvantages: [
      { targetId: 'tank', pct: 55, label: 'MIL-MBT-07 (yakın muharebe)' },
      { targetId: 'special', pct: 60, label: 'MIL-SOF-11 Özel Kuvvetler' },
    ],
  },
  sniper: {
    speed: 3,
    cargo: 60,
    fuelPerSortie: 6,
    advantages: [
      { targetId: 'infantry', pct: 160, label: 'MIL-IN-01 Piyade Taburu' },
      { targetId: 'scout', pct: 135, label: 'Keşif varlıkları' },
    ],
    disadvantages: [
      { targetId: 'armor', pct: 45, label: 'MIL-APC-15' },
      { targetId: 'tank', pct: 35, label: 'MIL-MBT-07' },
    ],
  },
  special: {
    speed: 5,
    cargo: 90,
    fuelPerSortie: 18,
    advantages: [
      { targetId: 'infantry', pct: 130, label: 'Düşük teçhizatlı hatlar' },
      { targetId: 'colonist', pct: 150, label: 'Lojistik konvoyları' },
    ],
    disadvantages: [
      { targetId: 'airdefense', pct: 50, label: 'MIL-ADS-04' },
      { targetId: 'tank', pct: 48, label: 'MIL-MBT-07' },
    ],
  },
  colonist: {
    speed: 3,
    cargo: 800,
    fuelPerSortie: 40,
    advantages: [],
    disadvantages: [
      { targetId: 'special', pct: 40, label: 'Sabotaj timleri' },
      { targetId: 'fighter', pct: 30, label: 'Hava baskını' },
    ],
  },
  scout: {
    speed: 12,
    cargo: 0,
    fuelPerSortie: 55,
    advantages: [],
    disadvantages: [
      { targetId: 'drone', pct: 45, label: 'Taktik İHA' },
      { targetId: 'fighter', pct: 25, label: 'Muharebe uçakları' },
    ],
  },
  fighter: {
    speed: 18,
    cargo: 0,
    fuelPerSortie: 120,
    advantages: [
      { targetId: 'infantry', pct: 145, label: 'Kara birlikleri (açık arazi)' },
      { targetId: 'armor', pct: 130, label: 'Zırhlı konvoylar' },
      { targetId: 'patrol', pct: 150, label: 'Hücumbot' },
      { targetId: 'frigate', pct: 125, label: 'Fırkateyn' },
    ],
    disadvantages: [
      { targetId: 'airdefense', pct: 50, label: 'MIL-ADS-04' },
    ],
  },
  bomber: {
    speed: 14,
    cargo: 0,
    fuelPerSortie: 180,
    advantages: [
      { targetId: 'infantry', pct: 140, label: 'Kara garnizonları' },
      { targetId: 'armor', pct: 125, label: 'Zırhlı hatlar' },
      { targetId: 'barracks', pct: 150, label: 'Sabit üs yapıları' },
    ],
    disadvantages: [
      { targetId: 'fighter', pct: 55, label: 'Muharebe uçağı koruması' },
      { targetId: 'airdefense', pct: 45, label: 'MIL-ADS-04' },
    ],
  },
  drone: {
    speed: 10,
    cargo: 0,
    fuelPerSortie: 25,
    advantages: [
      { targetId: 'infantry', pct: 135, label: 'MIL-IN-01' },
      { targetId: 'scout', pct: 150, label: 'Keşif uçakları' },
    ],
    disadvantages: [
      { targetId: 'airdefense', pct: 55, label: 'MIL-ADS-04' },
    ],
  },
  patrol: {
    speed: 11,
    cargo: 50,
    fuelPerSortie: 70,
    advantages: [
      { targetId: 'patrol', pct: 120, label: 'Küçük deniz hedefleri' },
    ],
    disadvantages: [
      { targetId: 'frigate', pct: 45, label: 'Fırkateyn' },
      { targetId: 'sub', pct: 40, label: 'Denizaltı' },
    ],
  },
  frigate: {
    speed: 8,
    cargo: 180,
    fuelPerSortie: 140,
    advantages: [
      { targetId: 'patrol', pct: 155, label: 'Hücumbot' },
      { targetId: 'sub', pct: 130, label: 'Denizaltı' },
    ],
    disadvantages: [
      { targetId: 'sub', pct: 55, label: 'Gelişmiş denizaltı' },
    ],
  },
  sub: {
    speed: 6,
    cargo: 100,
    fuelPerSortie: 95,
    advantages: [
      { targetId: 'frigate', pct: 150, label: 'Fırkateyn' },
      { targetId: 'patrol', pct: 140, label: 'Hücumbot' },
    ],
    disadvantages: [
      { targetId: 'frigate', pct: 50, label: 'Güdümlü fırkateyn (karşı-torpil)' },
    ],
  },
};

export const BUILDING_ENCYCLOPEDIA = {
  hq: {
    lore: 'Bölge komuta merkezi. Radar menzili ve yeni üs koruması.',
    effectLabel: 'Komuta menzili',
    perLevel: (lv) => `Radar +${lv * 8} km · Yeni üs koruması +${lv} gün`,
  },
  farm: { lore: 'Gıda ve ikmal üretimi. Nüfus ve moral için kritik.', effectLabel: 'Saatlik yemek' },
  refinery: { lore: 'Yakıt rafinerisi. Motorlu birlikler ve konvoylar için.', effectLabel: 'Saatlik yakıt' },
  factory: { lore: 'Metal ve mühimmat hammaddesi.', effectLabel: 'Saatlik metal' },
  plant: { lore: 'Elektrik üretimi. Endüstri hatları için zorunlu.', effectLabel: 'Saatlik enerji' },
  tax: { lore: 'Vergi geliri. Yüksek oran moral kaybına yol açar.', effectLabel: 'Saatlik para' },
  depot: {
    lore: 'Kaynak depolama ve sevkiyat terminali.',
    effectLabel: 'Depo kapasitesi',
    perLevel: (lv) => `+${(lv * 2500).toLocaleString('tr-TR')} depo üst sınırı`,
  },
  barracks: {
    lore: 'Kara birliği üretimi ve eğitim.',
    effectLabel: 'Kışla verimi',
    perLevel: (lv) => `Üretim hızı +${lv * 4}%`,
  },
  airport: {
    lore: 'Hava birliği üretimi ve üs operasyonları.',
    effectLabel: 'Hava üssü',
    perLevel: (lv) => `Hava üretim hızı +${lv * 5}%`,
  },
  shipyard: {
    lore: 'Deniz birliği üretimi. Yalnızca kıyı şehirlerinde.',
    effectLabel: 'Tersane',
    perLevel: (lv) => `Deniz üretim hızı +${lv * 5}%`,
  },
  intel: {
    lore: 'Keşif, SIGINT ve karşı istihbarat.',
    effectLabel: 'Karşı istihbarat',
    perLevel: (lv) => `Koruma +${lv * 3}%`,
  },
  wall: {
    lore: 'Perimetre savunması ve eriş kontrolü.',
    effectLabel: 'Savunma bonusu',
    perLevel: (lv) => `Garnizon savunması +${lv * 2}%`,
  },
  market: {
    lore: 'Kaynak transferi ve konvoy ticareti.',
    effectLabel: 'Ticaret',
    perLevel: (lv) => `Konvoy kapasitesi +${lv * 6}%`,
  },
  research: {
    lore: 'Askeri teknoloji araştırmaları.',
    effectLabel: 'Ar-Ge',
    perLevel: (lv) => `Araştırma hızı +${lv * 3}%`,
  },
  cyber_ops: {
    lore: 'Siber virüs, dezenformasyon ve altyapı baskısı.',
    effectLabel: 'Siber FW',
    perLevel: (lv) => `Sızma / savunma FW Sv.${lv}`,
  },
};

export const RESEARCH_ENCYCLOPEDIA = {
  r1: {
    lore: 'Kara birliklerinin saldırı gücünü artırır.',
    effectLabel: 'Kara saldırı bonusu',
    perLevel: (lv) => (lv > 0 ? `+${lv * 3}% saldırı` : '—'),
  },
  r2: {
    lore: 'Tüm maden ve üretim hatlarına verim bonusu.',
    effectLabel: 'Üretim hızı',
    perLevel: (lv) => (lv > 0 ? `+${lv * 2}% saatlik üretim` : '—'),
  },
  r3: {
    lore: 'Casusluk ve istihbarat operasyonlarında başarı.',
    effectLabel: 'Casusluk',
    perLevel: (lv) => (lv > 0 ? `+${lv} casus seviyesi` : '—'),
  },
  r4: {
    lore: 'Hava saldırılarına karşı savunma.',
    effectLabel: 'Hava savunma',
    perLevel: (lv) => (lv > 0 ? `+${lv * 2}% hava savunma` : '—'),
  },
  [KBRN_RESEARCH_IDS.weapon]: {
    lore: 'Kimyasal/biyolojik ajan geliştirme. Sinsi harita operasyonları.',
    effectLabel: 'KBRN silahı',
    perLevel: (lv) => (lv > 0 ? `Operasyon gücü Sv.${lv}` : 'Kilitli'),
  },
  [KBRN_RESEARCH_IDS.decontamination]: {
    lore: 'Panzehir ve dekontaminasyon. AI salgınlarına karşı koruma.',
    effectLabel: 'Panzehir',
    perLevel: (lv) => (lv > 0 ? `Hasar azaltma ${Math.min(92, lv * 9)}%` : '—'),
  },
  [KBRN_RESEARCH_IDS.detection]: {
    lore: 'Düşman KBRN protokollerini istihbarat raporlarında listeler.',
    effectLabel: 'KBRN tespit',
    perLevel: (lv) => (lv > 0 ? `Protokol derinliği +${lv}` : '—'),
  },
  kbrn_chem: {
    lore: 'Eski kayıt — KBRN Silahı ile birleştirildi.',
    effectLabel: '—',
    perLevel: () => '—',
  },
};

export const RESEARCH_PREREQUISITES = {
  [KBRN_RESEARCH_IDS.weapon]: [{ label: 'Ar-Ge Merkezi', buildingId: 'research', level: 8 }],
  [KBRN_RESEARCH_IDS.decontamination]: [{ label: 'Ar-Ge Merkezi', buildingId: 'research', level: 8 }],
  [KBRN_RESEARCH_IDS.detection]: [{ label: 'Ar-Ge Merkezi', buildingId: 'research', level: 8 }],
};

export function getBuildingPrereqTree(buildingId) {
  return (BUILDING_PREREQUISITES[buildingId] ?? []).map((req) => ({
    id: req.id,
    label: BUILDING_LABELS[req.id] ?? req.id,
    level: req.level,
  }));
}

export function isProductionBuilding(buildingId) {
  return Boolean(BUILDING_RESOURCE_MAP[buildingId]);
}

export function getProductionHourlyAtLevel(buildingId, level) {
  const base = BASE_HOURLY[buildingId] ?? 0;
  const per = HOURLY_PER_LEVEL[buildingId] ?? 0;
  return Math.floor(base + level * per);
}
