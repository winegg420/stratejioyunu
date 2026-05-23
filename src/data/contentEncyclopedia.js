import { BUILDING_PREREQUISITES, BUILDING_LABELS } from '../lib/buildingUtils';
import { BUILDING_RESOURCE_MAP, BASE_HOURLY, HOURLY_PER_LEVEL } from '../lib/gameUtils';
import { KBRN_RESEARCH_IDS, KBRN_RESEARCH_CENTER_UNLOCK } from '../lib/kbrnResearch';

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
    lore: 'Ana üs mimarisi. Radar menzili ve yeni üs koruması.',
    effectLabel: 'Komuta menzili',
    perLevel: (lv) => `Radar +${lv * 8} km · Yeni üs koruması +${lv} gün`,
  },
  refinery: {
    lore: 'Temel hammadde ve petrol üretimi.',
    effectLabel: 'Petrol / hammadde',
    perLevel: (lv) => `Petrol +${(12 + lv * 2.5).toFixed(0)}/sa · Hammadde +${(12 + lv * 2.5).toFixed(0)}/sa`,
  },
  plant: {
    lore: 'Tüm üssün siber ve fiziksel güç çarpanı.',
    effectLabel: 'Enerji / güç çarpanı',
    perLevel: (lv) => `Enerji +${8 + lv * 1.5}/sa · Üretim gücü +${lv * 2}%`,
  },
  barracks: {
    lore: 'Kara ordusu üretimi ve taktik simülatör.',
    effectLabel: 'Kara Kuvvetleri verimi',
    perLevel: (lv) => `Üretim hızı +${lv * 4}%`,
  },
  airport: {
    lore: 'Hava filolarının konuşlandığı stratejik hat.',
    effectLabel: 'Hava üssü',
    perLevel: (lv) => `Hava üretim hızı +${lv * 5}%`,
  },
  shipyard: {
    lore: 'Devasa tersane kompleksi — deniz filosu üretimi.',
    effectLabel: 'Deniz üssü',
    perLevel: (lv) => `Deniz üretim hızı +${lv * 5}%`,
  },
  intel: {
    lore: 'Veri sızıntıları, ajan yönetimi ve karşı istihbarat.',
    effectLabel: 'Karşı istihbarat',
    perLevel: (lv) => `Koruma +${lv * 3}%`,
  },
  market: {
    lore: 'Pazar yerinin fiziksel operasyon üssü — konvoy ticareti.',
    effectLabel: 'Ticaret / bütçe',
    perLevel: (lv) => `Bütçe +${18 + lv * 3}/sa · Konvoy +${lv * 6}%`,
  },
  research: {
    lore: 'Teknoloji ağacının kilidini açan ana laboratuvar.',
    effectLabel: 'Uranyum / Ar-Ge',
    perLevel: (lv) => (lv >= 8
      ? `Uranyum +${(0.4 + lv * 0.12).toFixed(1)}/sa · Ar-Ge +${lv * 3}%`
      : `Ar-Ge +${lv * 3}% (Uranyum Sv.8+)`),
  },
  cyber_ops: {
    lore: 'Siber saldırı ve defans / Lockdown yönetim paneli.',
    effectLabel: 'Siber FW',
    perLevel: (lv) => `Sızma / savunma FW Sv.${lv}`,
  },
  ai_center: {
    lore: 'Devasa veri binası — tüm optimizasyonları hızlandırır.',
    effectLabel: 'AI optimizasyon',
    perLevel: (lv) => `İnşaat / üretim / casusluk +${lv * 2}%`,
  },
};

export const RESEARCH_ENCYCLOPEDIA = {
  r1: {
    lore: 'Kara muharebe doktrini ve birlik koordinasyonu.',
    effectLabel: 'Kara savaş',
    perLevel: (lv) => (lv > 0 ? `+${lv * 3}% kara saldırı` : '—'),
  },
  r2: {
    lore: 'Hava üstünlüğü ve üs operasyonları.',
    effectLabel: 'Hava kuvvetleri',
    perLevel: (lv) => (lv > 0 ? `+${lv * 4}% hava üretim` : '—'),
  },
  r3: {
    lore: 'Deniz ve amfibi çıkarma kapasitesi.',
    effectLabel: 'Deniz harekat',
    perLevel: (lv) => (lv > 0 ? `+${lv * 4}% deniz üretim` : '—'),
  },
  r4: {
    lore: 'Stratejik savunma ve KBRN hasar azaltma (panzehir).',
    effectLabel: 'Savunma kalkanı',
    perLevel: (lv) => (lv > 0 ? `Savunma +${lv * 2}% · Hasar azaltma ${Math.min(92, lv * 9)}%` : '—'),
  },
  r5: {
    lore: 'Elektronik harp ve radar karıştırma.',
    effectLabel: 'EW',
    perLevel: (lv) => (lv > 0 ? `Komuta baskısı +${lv * 2}%` : '—'),
  },
  r6: {
    lore: 'Ajan ağı, casusluk ve KBRN protokol tespiti.',
    effectLabel: 'İstihbarat',
    perLevel: (lv) => (lv > 0 ? `Casus +${lv} · Tespit derinliği +${lv}` : '—'),
  },
  r7: {
    lore: 'Siber operasyon matrisi ve Lockdown yönetimi.',
    effectLabel: 'Siber',
    perLevel: (lv) => (lv > 0 ? `Siber FW Sv.${lv}` : '—'),
  },
  r8: {
    lore: 'Gelişmiş şifreleme ve karşı-istihbarat.',
    effectLabel: 'Şifreleme',
    perLevel: (lv) => (lv > 0 ? `SIGINT koruması +${lv * 3}%` : '—'),
  },
  r9: {
    lore: 'KBRN silah programı — sinsi harita operasyonları.',
    effectLabel: 'KBRN silahı',
    perLevel: (lv) => (lv > 0 ? `Operasyon gücü Sv.${lv}` : 'Kilitli'),
  },
  r10: {
    lore: 'Ağır sanayi ve nükleer enerji hatları.',
    effectLabel: 'Üretim',
    perLevel: (lv) => (lv > 0 ? `+${lv * 2}% saatlik üretim` : '—'),
  },
  r11: {
    lore: 'Füze ve balistik sistemler.',
    effectLabel: 'Stratejik vuruş',
    perLevel: (lv) => (lv > 0 ? `Menzil +${lv * 5}%` : '—'),
  },
  r12: {
    lore: 'Yapay zeka entegrasyonu — tüm optimizasyonlar.',
    effectLabel: 'AI',
    perLevel: (lv) => (lv > 0 ? `İnşaat / üretim / casusluk +${lv * 2}%` : '—'),
  },
  kbrn_weapon: {
    lore: 'Eski kayıt — KBRN Silah Programı (r9).',
    effectLabel: '—',
    perLevel: () => '—',
  },
  kbrn_chem: {
    lore: 'Eski kayıt — KBRN Silah Programı (r9).',
    effectLabel: '—',
    perLevel: () => '—',
  },
};

const ADVANCED_PREREQ = [{ label: 'Ar-Ge Merkezi', buildingId: 'research', level: KBRN_RESEARCH_CENTER_UNLOCK }];

export const RESEARCH_PREREQUISITES = {
  r9: ADVANCED_PREREQ,
  r10: ADVANCED_PREREQ,
  r11: ADVANCED_PREREQ,
  r12: ADVANCED_PREREQ,
  [KBRN_RESEARCH_IDS.weapon]: ADVANCED_PREREQ,
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
