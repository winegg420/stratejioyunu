import { applyUnitDisplayList, getUnitDisplayName } from './unitCatalog';
import { createResearchTemplates } from './researchCatalog';

export const GAME_NAME = 'STRATEJİ OYUNU';
export const SERVER_NAME = 'Türkiye-1 Sezon';
export const CITY_NAME = 'İzmir';
export const CITY_TYPE = 'Kıyı Şehri';
export const PLAYER_NAME = 'Komutan_Alpha';
export const PLAYER_RANK = 'Teğmen';
export const ALLIANCE = 'Ege Komutanlığı';
export const PROTECTION_DAYS = 7;

export const resources = [
  { id: 'food', label: 'Nüfus', icon: '👥', current: 12450, max: 20000, rate: '+42/sa' },
  { id: 'fuel', label: 'Petrol', icon: '🛢️', current: 8320, max: 15000, rate: '+28/sa' },
  { id: 'hammadde', label: 'Hammadde', icon: '🧱', current: 16400, max: 18000, rate: '+35/sa' },
  { id: 'energy', label: 'Enerji', icon: '⚡', current: 4200, max: null, rate: '+18/sa' },
  { id: 'money', label: 'Bütçe', icon: '💰', current: 28900, max: 50000, rate: '+55/sa' },
  { id: 'uranium', label: 'Uranyum', icon: '☢️', current: 12, max: 500, rate: '+0/sa' },
];

export const buildings = [
  { id: 'hq', name: 'Komuta Merkezi', category: 'Temel', level: 1, maxLevel: null, desc: 'Ana üs mimarisi. Radar menzili, üs koruması ve stratejik komuta.', image: '🏛️', cost: '—', time: '—', producing: false },
  { id: 'refinery', name: 'Yakıt Rafinerisi', category: 'Üretim', level: 6, maxLevel: null, desc: 'Temel hammadde ve petrol üretimi. Konvoy ve motorlu birlikler için.', image: '⛽', cost: '3.100 hammadde · 2.200 bütçe', time: '—', producing: true },
  { id: 'plant', name: 'Enerji Santrali', category: 'Üretim', level: 9, maxLevel: null, desc: 'Tüm üssün siber ve fiziksel güç çarpanı. Rafineri ve operasyon hatları için zorunlu.', image: '⚡', cost: '—', time: '—', producing: true },
  { id: 'barracks', name: 'Kışla', category: 'Askeri', level: 10, maxLevel: null, desc: 'Kara ordusu üretimi ve taktik simülatör.', image: '🪖', cost: '5.200 hammadde', time: '03:20:00', producing: false },
  { id: 'airport', name: 'Hava Üssü', category: 'Askeri', level: 4, maxLevel: null, desc: 'Hava filolarının konuşlandığı stratejik hat.', image: '✈️', cost: '8.000 hammadde', time: '—', producing: false },
  { id: 'shipyard', name: 'Deniz Üssü', category: 'Askeri', level: 3, maxLevel: null, desc: 'Devasa tersane kompleksi — deniz filosu üretimi. Kıyı şehirlerinde.', image: '⚓', cost: '6.500 hammadde', time: '—', producing: false, coastalOnly: true },
  { id: 'intel', name: 'İstihbarat Merkezi', category: 'Teknoloji', level: 6, maxLevel: null, desc: 'Veri sızıntıları, ajan yönetimi ve karşı istihbarat.', image: '📡', cost: '3.400 hammadde', time: '—', producing: false },
  {
    id: 'cyber_ops',
    name: 'Siber Operasyon Merkezi',
    category: 'Siber',
    level: 0,
    maxLevel: null,
    desc: 'Siber saldırı ve defans / Lockdown yönetim paneli.',
    image: '💻',
    cost: '2.200 hammadde · 1.400 enerji',
    time: '00:09:00',
    producing: false,
  },
  { id: 'research', name: 'Ar-Ge Merkezi', category: 'Teknoloji', level: 8, maxLevel: null, desc: 'Teknoloji ağacının kilidini açan ana laboratuvar.', image: '🔬', cost: '—', time: '—', producing: false },
  {
    id: 'ai_center',
    name: 'Yapay Zeka Merkezi',
    category: 'Teknoloji',
    level: 0,
    maxLevel: 15,
    desc: 'Devasa veri binası — tüm optimizasyonları hızlandırır; yüksek enerji tüketir.',
    image: '🧠',
    cost: '95.000 hammadde · 62.000 bütçe · 22.000 enerji',
    time: '28:00:00',
    producing: false,
  },
  { id: 'market', name: 'Ticaret Terminali', category: 'Ticaret', level: 4, maxLevel: null, desc: 'Pazar yerinin (Market) fiziksel operasyon üssü — konvoy ticareti.', image: '🏪', cost: '2.200 hammadde', time: '—', producing: false },
];

/** Demo araştırma listesi — canlı oyun createStarterResearches() kullanır */
export const researches = createResearchTemplates().map((r) => {
  const demo = { r1: 4, r6: 3, r10: 6 };
  const level = demo[r.id] ?? 0;
  return {
    ...r,
    level,
    active: r.id === 'r1' && level > 0,
    time: r.time ?? '—',
    cost: r.cost ?? '—',
  };
});

const landUnitsBase = [
  { id: 'infantry', name: 'Piyade', attack: 42, defense: 38, cost: '280 hammadde · 160 nüfus', time: '00:08:00', count: 2400, image: '🪖', desc: 'Siber destekli hafif piyade. Şehir savunması ve gerilla taktiklerinde etkili.' },
  { id: 'armor', name: 'Zırhlı Araç', attack: 68, defense: 72, cost: '720 hammadde · 340 nüfus · 120 petrol', time: '00:22:00', count: 380, image: '🚛', desc: 'Zırhlı taşıyıcı konvoyu. Piyadeye karşı üstün; ağır tanklara karşı sınırlı.' },
  { id: 'tank', name: 'Tank', attack: 118, defense: 95, cost: '1.450 hammadde · 620 nüfus · 280 petrol', time: '00:45:00', count: 120, image: '🛡️', desc: 'Ana muharebe tankı. Zırhlı birlik ve sabit savunmaya karşı yüksek penetrasyon.' },
  { id: 'airdefense', name: 'Hava Savunma', attack: 35, defense: 142, cost: '980 hammadde · 420 nüfus · 380 enerji', time: '00:38:00', count: 40, image: '📡', desc: 'Entegre hava savunma bataryası. İHA ve bombardımana karşı kritik.' },
  { id: 'sniper', name: 'Keskin Nişancı', attack: 88, defense: 28, cost: '520 hammadde · 210 nüfus', time: '00:18:00', count: 85, image: '🎯', desc: 'Uzun menzil eliminasyon timi. Hafif piyade ve keşif birliklerine karşı ölümcül.' },
  { id: 'special', name: 'Özel Tim', attack: 102, defense: 64, cost: '1.120 hammadde · 480 nüfus · 260 bütçe', time: '00:35:00', count: 45, image: '⚔️', desc: 'Gölge operasyon ve sabotaj. Düşman lojistik hatlarına yüksek baskı.' },
  { id: 'colonist', name: 'Göçmen / İnşaat Aracı', attack: 8, defense: 22, cost: '1.600 hammadde · 900 nüfus · 420 bütçe', time: '01:30:00', count: 0, image: '🏙️', desc: 'Koloni ve üs inşaat konvoyu. Yeni şehir kurulumu için zorunlu.' },
];

export const landUnits = applyUnitDisplayList(landUnitsBase);

const airUnitsBase = [
  { id: 'scout', name: 'Keşif Uçağı', attack: 0, defense: 5, cost: '200 hammadde · 100 petrol', time: '00:12:00', count: 12, image: '🔭', desc: 'Keşif yapar, savaşmaz.' },
  { id: 'fighter', name: 'Savaş Uçağı', attack: 55, defense: 30, cost: '1.200 hammadde · 600 petrol', time: '00:55:00', count: 28, image: '✈️', desc: 'Kara birlikleri ve gemilere karşı güçlü.' },
  { id: 'bomber', name: 'Bombardıman', attack: 70, defense: 15, cost: '1.800 hammadde · 900 petrol', time: '01:10:00', count: 8, image: '💣', desc: 'Binalara ve kara birliklerine karşı etkili.' },
  { id: 'drone', name: 'Drone', attack: 20, defense: 18, cost: '400 hammadde · 200 petrol', time: '00:15:00', count: 35, image: '🛸', desc: 'Piyade ve keşif uçaklarına karşı etkili.' },
];

export const airUnits = applyUnitDisplayList(airUnitsBase);

const seaUnitsBase = [
  { id: 'patrol', name: 'Hücumbot', attack: 25, defense: 22, cost: '500 hammadde · 300 petrol', time: '00:25:00', count: 18, image: '🚤', desc: 'Hızlı saldırı, küçük gemilere karşı.' },
  { id: 'frigate', name: 'Fırkateyn', attack: 50, defense: 45, cost: '1.400 hammadde · 700 petrol', time: '01:00:00', count: 6, image: '🚢', desc: 'Hücumbota ve denizaltıya karşı güçlü.' },
  { id: 'sub', name: 'Denizaltı', attack: 60, defense: 25, cost: '1.600 hammadde · 800 petrol', time: '01:15:00', count: 4, image: '🔱', desc: 'Fırkateyn ve uçak gemisine karşı etkili.' },
];

export const seaUnits = applyUnitDisplayList(seaUnitsBase);

export const idleTroops = [
  { id: 'infantry', name: getUnitDisplayName('infantry', 'Piyade'), icon: '🪖', available: 1840 },
  { id: 'armor', name: getUnitDisplayName('armor', 'Zırhlı Araç'), icon: '🚛', available: 320 },
  { id: 'tank', name: getUnitDisplayName('tank', 'Tank'), icon: '🛡️', available: 95 },
  { id: 'airdefense', name: getUnitDisplayName('airdefense', 'Hava Savunma'), icon: '📡', available: 24 },
  { id: 'sniper', name: 'Keskin Nişancı', icon: '🎯', available: 62 },
];

export const idleSpies = 12;

export const activeExpeditions = [
  {
    id: 'e1',
    target: 'Manisa',
    type: 'Saldırı',
    direction: 'outgoing',
    remaining: '00:18:42',
    troops: '400 Piyade, 20 Tank',
  },
  {
    id: 'e2',
    target: 'Bursa',
    type: 'Ganimet Dönüşü',
    direction: 'returning',
    remaining: '00:42:10',
    troops: 'Yük konvoyu',
  },
  {
    id: 'e3',
    target: 'Ankara',
    type: 'Casus Keşfi',
    direction: 'outgoing',
    remaining: '00:05:22',
    troops: '5 Casus',
  },
];

export const pastExpeditions = [];

export const intelOps = [];

export const tradeOffers = [];

export const diplomacy = {
  alliance: { name: 'Ege Komutanlığı', members: 24, mode: 'Liderli', leader: 'Komutan_Alpha' },
  treaties: [
    {
      partner: 'KaraKurt',
      partnerAlliance: 'Boğaz İmparatorluğu',
      type: 'NAP',
      status: 'active',
    },
    {
      partner: 'SteelWolf',
      partnerAlliance: '—',
      type: 'Ateşkes',
      status: 'active',
    },
  ],
  votes: [],
};

export const reports = [
  {
    id: 'r1',
    filterType: 'battle',
    type: 'Savaş',
    title: 'Manisa — Saldırı Raporu',
    date: '17.05.2026 14:22',
    preview: 'Zafer! Garnizon imha edildi, ganimet toplandı.',
    winner: 'player',
    attacker: 'Komutan_Alpha',
    defender: 'Boş kale',
    attackerLosses: '12 Piyade, 1 Tank',
    defenderLosses: 'Tüm garnizon',
    attackerLossRows: [
      { unitId: 'infantry', name: 'Piyade', icon: '🪖', sent: 400, lost: 12 },
      { unitId: 'tank', name: 'Tank', icon: '🛡️', sent: 20, lost: 1 },
      { unitId: 'armor', name: 'Zırhlı Araç', icon: '🚛', sent: 50, lost: 0 },
    ],
    defenderLossRows: [{ name: 'Garnizon', icon: '🏰', sent: 0, lost: 0, note: 'Garnizon imha' }],
    loot: [
      { icon: '👥', label: 'Nüfus', amount: 2400 },
      { icon: '🧱', label: 'Hammadde', amount: 1800 },
      { icon: '💰', label: 'Bütçe', amount: 920 },
      { icon: '🛢️', label: 'Petrol', amount: 450 },
    ],
  },
  {
    id: 'r2',
    filterType: 'spy',
    type: 'Casusluk',
    title: 'Ankara — Keşif Raporu',
    date: '17.05.2026 12:08',
    preview: 'Düşman depoları ve birlik dağılımı tespit edildi.',
    winner: null,
    targetCity: 'Ankara',
    intelSuccess: true,
    findings: 'Rafineri Sv.7 · 2.200 Piyade · 45 Tank · Ticaret terminali aktif',
    enemyTroops: { infantry: 2200, tank: 45, armor: 120, sniper: 30 },
  },
  {
    id: 'r3',
    filterType: 'battle',
    type: 'Savaş',
    title: 'İstanbul — Savunma Raporu',
    date: '16.05.2026 22:41',
    preview: 'Yenilgi. Saldırı geri püskürtüldü.',
    winner: 'enemy',
    attacker: 'Komutan_Alpha',
    defender: 'KaraKurt',
    attackerLosses: '180 Piyade, 8 Tank, 2 Zırhlı',
    defenderLosses: '45 Piyade, 1 Tank',
    attackerLossRows: [
      { unitId: 'infantry', name: 'Piyade', icon: '🪖', sent: 500, lost: 180 },
      { unitId: 'tank', name: 'Tank', icon: '🛡️', sent: 40, lost: 8 },
      { unitId: 'armor', name: 'Zırhlı Araç', icon: '🚛', sent: 30, lost: 2 },
      { unitId: 'sniper', name: 'Keskin Nişancı', icon: '🎯', sent: 20, lost: 0 },
    ],
    defenderLossRows: [
      { unitId: 'infantry', name: 'Piyade', icon: '🪖', sent: 0, lost: 45 },
      { unitId: 'tank', name: 'Tank', icon: '🛡️', sent: 0, lost: 1 },
    ],
    loot: [],
  },
  {
    id: 'r4',
    filterType: 'spy',
    type: 'Casusluk',
    title: 'Trabzon — Sabotaj Raporu',
    date: '16.05.2026 18:15',
    preview: 'Casuslar yakalandı — operasyon başarısız.',
    winner: null,
    intelSuccess: false,
    findings: '3 casus kayıp',
  },
];

export const newsFeed = [
  { type: 'fetih', text: '[KaraKurt] İstanbul\'u fethetti!', time: '20:32' },
  { type: 'sefer', text: '[SteelWolf] Ankara\'ya sefer düzenledi, 2.400 altın ganimet aldı', time: '19:15' },
  { type: 'ittifak', text: '[NordStrike] ile [BlackSea] ittifak kurdu', time: '18:50' },
  { type: 'kayip', text: '[Falcon99] Trabzon\'u kaybetti, yeni konuma çekildi', time: '17:30' },
  { type: 'meydan', text: '[KaraKurt] Meydan Savaşı ilan etti — Hedef: Bursa', time: '16:00' },
];

/** State Mail — liderden lidere resmi şifreli yazışmalar */
export const stateMailMessages = [
  {
    id: 'sm1',
    fromPresident: 'President_Volkov · Doğu Paktı',
    subject: 'Gizli Kanal — enerji koridoru anlaşması',
    encryption: 'QUANTUM-SHIELD · ALLIANCE-CHAN',
    time: '2044-05-18 14:22 UTC',
    body: 'Sayın Başkan,\n\nBölgesel denge değişiyor. Petrol koridorunuz bizim için kritik. Karşılıklı saldırmazlık ve 72 saatlik konvoy güvencesi teklif ediyoruz. Yanıtınızı bu kanal üzerinden bekliyoruz.\n\n— Office of President Volkov',
    unread: true,
  },
  {
    id: 'sm2',
    fromPresident: 'President_Chen · Pasifik Birliği',
    subject: 'Uyarı: sınır ihlali raporu',
    encryption: 'BURN-AFTER-READ · RED-CHANNEL',
    time: '2044-05-17 09:01 UTC',
    body: 'Resmi kayıtlarımıza göre birlikleriniz doğu sektöründe izinsiz hareket etti. 24 saat içinde geri çekilmezse karşı tedbir devreye alınacaktır.\n\nBu mesaj okunduktan sonra şifreli kopya imha edilir.',
    unread: true,
  },
  {
    id: 'sm3',
    fromPresident: 'President_Mercer · Atlantik Konseyi',
    subject: 'Ticaret rotası — karşılıklı tanıma',
    encryption: 'AES-256 · STATE-MAIL',
    time: '2044-05-15 22:40 UTC',
    body: 'Merhaba Başkan,\n\nKonvoy rotalarınızı haritada gördük. Ortak ticaret hattı öneriyoruz: %12 vergi indirimi karşılığında 30 gün koridor güvenliği. Detaylar ekte (simülasyon).\n\nSaygılarımla,\nMercer',
    unread: false,
  },
];

/** @deprecated State Mail için stateMailMessages kullanın */
export const messages = stateMailMessages;

export const profile = {
  username: 'Komutan_Alpha',
  rank: 'Teğmen',
  points: 8420,
  cities: 1,
  alliance: 'Ege Komutanlığı',
  seasonHistory: [
    { season: 'Türkiye-1 S1', rank: 12, points: 45200, cities: 3 },
    { season: 'Türkiye-1 S0', rank: 45, points: 12800, cities: 1 },
  ],
  badges: ['İlk Kan', 'Tüccar', 'Hayatta Kalan'],
};

export const mapCities = [
  { name: 'İstanbul', owner: null, population: 48000, type: 'Kıyı', tier: 'capital', status: 'bot', worldRole: 'bot_coastal', provinceName: 'İstanbul', lat: 41.01, lng: 28.97 },
  { name: 'İzmir', owner: null, population: 12500, type: 'Kıyı', tier: 'metropolis', status: 'bot', worldRole: 'bot_coastal', provinceName: 'İzmir', lat: 38.42, lng: 27.14 },
  { name: 'Ankara', owner: null, population: 22000, type: 'Başkent', tier: 'capital', status: 'bot', worldRole: 'bot_capital', provinceName: 'Ankara', lat: 39.93, lng: 32.85 },
  { name: 'Trabzon', owner: 'Falcon99', ownerIdeology: 'technocrat', population: 8500, type: 'Kıyı', tier: 'town', status: 'enemy', worldRole: 'bot_coastal', provinceName: 'Trabzon', lat: 41.00, lng: 39.72 },
  { name: 'Manisa', owner: null, population: 0, type: 'Küçükşehir', tier: 'town', status: 'empty', worldRole: 'world_empty', provinceName: 'Manisa', lat: 38.62, lng: 27.43 },
];

export const expeditionSummary = {
  incoming: activeExpeditions.filter((e) => e.direction === 'returning').length,
  outgoing: activeExpeditions.filter((e) => e.direction === 'outgoing').length,
};

export const constructionQueue = [
  { name: 'Yakıt Rafinerisi', level: 7, remaining: '01:45:00' },
  { name: 'Ar-Ge Merkezi', level: 9, remaining: '03:12:00', queued: true },
];

export const productionQueue = [
  { unit: 'Piyade', count: 200, remaining: '00:42:00' },
  { unit: 'Tank', count: 5, remaining: '02:15:00', queued: true },
];

/** Demo / Supabase kapalı — ideoloji sadakat sıralaması */
export const LOYALTY_LEADERBOARD_DEMO = [
  { playerName: 'VatanSavunucu', displayName: 'VatanSavunucu', ideology: 'nationalist', loyaltyScore: 18420, alliance: 'Anadolu Hattı' },
  { playerName: 'BorsaKrali', displayName: 'BorsaKrali', ideology: 'capitalist', loyaltyScore: 16250, alliance: 'Ege Ticaret' },
  { playerName: 'Komutan_Alpha', displayName: 'Komutan_Alpha', ideology: 'technocrat', loyaltyScore: 12800, alliance: 'Ege Komutanlığı' },
  { playerName: 'HalkKonvoyu', displayName: 'HalkKonvoyu', ideology: 'socialist', loyaltyScore: 11440, alliance: '—' },
  { playerName: 'KuzeyTank', displayName: 'KuzeyTank', ideology: 'nationalist', loyaltyScore: 9870, alliance: 'Kuzey Blok' },
  { playerName: 'TeknoArGe', displayName: 'TeknoArGe', ideology: 'technocrat', loyaltyScore: 9120, alliance: '—' },
  { playerName: 'AltinKonvoy', displayName: 'AltinKonvoy', ideology: 'capitalist', loyaltyScore: 8010, alliance: 'Marmara Birliği' },
  { playerName: 'KirmiziHat', displayName: 'KirmiziHat', ideology: 'socialist', loyaltyScore: 7650, alliance: 'Sol Cephe' },
];

export const MOBILE_NAV_ITEMS = [
  { path: '/harita', icon: '🗺️', labelKey: 'nav.map' },
  { path: '/', icon: '🏙️', labelKey: 'nav.city' },
  { path: '/binalar', icon: '🏗️', labelKey: 'nav.buildings' },
  { path: '/seferler', icon: '⚔️', labelKey: 'nav.expeditions' },
  { path: '/sezon-gorevler', icon: '🏆', labelKey: 'nav.seasonQuests' },
  { path: '/siralama', icon: '📊', labelKey: 'nav.rankings' },
  { path: '/admin-log', icon: '📜', labelKey: 'nav.adminLog' },
  { path: '/profil', icon: '👤', labelKey: 'nav.profile' },
];

export const NAV_ITEMS = [
  { path: '/', icon: '🏠', labelKey: 'nav.home' },
  { path: '/binalar', icon: '🏗️', labelKey: 'nav.buildings' },
  { path: '/arastirma', icon: '🔬', labelKey: 'nav.research' },
  { path: '/kisla', icon: '🪖', labelKey: 'nav.barracks' },
  { path: '/hava', icon: '✈️', labelKey: 'nav.airbase' },
  { path: '/tersane', icon: '⚓', labelKey: 'nav.shipyard', coastal: true },
  { path: '/seferler', icon: '⚔️', labelKey: 'nav.expeditions' },
  { path: '/istihbarat', icon: '🕵️', labelKey: 'nav.intelligence' },
  { path: '/pazar', icon: '🏪', labelKey: 'nav.market' },
  { path: '/kara-borsa', icon: '🕶️', labelKey: 'nav.blackMarket' },
  { path: '/ticaret', icon: '💰', labelKey: 'nav.trade' },
  { path: '/diplomasi', icon: '🤝', labelKey: 'nav.diplomacy' },
  { path: '/raporlar', icon: '📋', labelKey: 'nav.reports' },
  { path: '/harita', icon: '🗺️', labelKey: 'nav.map' },
  { path: '/sezon-gorevler', icon: '🏆', labelKey: 'nav.seasonQuests' },
  { path: '/siralama', icon: '📊', labelKey: 'nav.rankings' },
  { path: '/admin-log', icon: '📜', labelKey: 'nav.adminLog' },
  { path: '/profil', icon: '👤', labelKey: 'nav.profile' },
  { path: '/mesajlar', icon: '🔐', labelKey: 'nav.messages' },
  { path: null, icon: '🤝', labelKey: 'nav.alliance', locked: true },
  { path: '/istihbarat', icon: '💻', labelKey: 'nav.cyberOps', locked: true, lockTag: 'CYBER OPS SV.1' },
];
