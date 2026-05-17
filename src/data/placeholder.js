export const GAME_NAME = '[OYUN ADI]';
export const SERVER_NAME = 'Türkiye-1 Sezon';
export const CITY_NAME = 'İzmir';
export const CITY_TYPE = 'Kıyı Şehri';
export const PLAYER_NAME = 'Komutan_Alpha';
export const PLAYER_RANK = 'Teğmen';
export const ALLIANCE = 'Ege Komutanlığı';
export const PROTECTION_DAYS = 5;

export const resources = [
  { id: 'food', label: 'Yemek', icon: '🌾', current: 12450, max: 20000, rate: '+42/sa' },
  { id: 'fuel', label: 'Yakıt', icon: '⛽', current: 8320, max: 15000, rate: '+28/sa' },
  { id: 'metal', label: 'Metal', icon: '⚙️', current: 15680, max: 18000, rate: '+35/sa' },
  { id: 'energy', label: 'Enerji', icon: '⚡', current: 4200, max: null, rate: '+18/sa' },
  { id: 'money', label: 'Para', icon: '💰', current: 28900, max: 50000, rate: '+55/sa' },
];

export const buildings = [
  { id: 'farm', name: 'Çiftlik', category: 'Üretim', level: 8, maxLevel: null, desc: 'Yemek üretir. Asker besleme ve nüfus büyümesi için kritik.', image: '🌾', cost: '2.400 metal · 1.800 yemek', time: '02:14:30', producing: true },
  { id: 'refinery', name: 'Rafineri', category: 'Üretim', level: 6, maxLevel: null, desc: 'Yakıt üretir. Seferler ve araç hareketi için gerekli.', image: '⛽', cost: '3.100 metal · 2.200 para', time: '—', producing: false },
  { id: 'factory', name: 'Fabrika', category: 'Üretim', level: 7, maxLevel: null, desc: 'Metal üretir. Bina inşaatı ve araç üretimi için.', image: '🏭', cost: '4.500 metal · 1.200 para', time: '01:45:00', producing: false, upgrading: true },
  { id: 'plant', name: 'Santral', category: 'Üretim', level: 9, maxLevel: null, desc: 'Enerji üretir. Fabrika ve rafinerinin çalışması için zorunlu.', image: '⚡', cost: '—', time: '—', producing: true },
  { id: 'tax', name: 'Vergi Binası', category: 'Ekonomi', level: 5, maxLevel: null, desc: 'Para üretir. Vergi oranı ayarlanabilir.', image: '🏛️', cost: '1.800 metal', time: '00:52:10', producing: false },
  { id: 'barracks', name: 'Kışla', category: 'Askeri', level: 10, maxLevel: null, desc: 'Kara birliği üretimi.', image: '🪖', cost: '5.200 metal', time: '03:20:00', producing: false },
  { id: 'airport', name: 'Havaalanı', category: 'Askeri', level: 4, maxLevel: null, desc: 'Hava birliği üretimi.', image: '✈️', cost: '8.000 metal', time: '—', producing: false },
  { id: 'shipyard', name: 'Tersane', category: 'Askeri', level: 3, maxLevel: null, desc: 'Deniz birliği üretimi. Sadece kıyı şehirlerde.', image: '⚓', cost: '6.500 metal', time: '—', producing: false, coastalOnly: true },
  { id: 'intel', name: 'İstihbarat Merkezi', category: 'Teknoloji', level: 6, maxLevel: null, desc: 'Casusluk ve karşı istihbarat.', image: '🕵️', cost: '3.400 metal', time: '—', producing: false },
  { id: 'wall', name: 'Kale Duvarı', category: 'Savunma', level: 7, maxLevel: null, desc: 'Savunma bonusu sağlar.', image: '🏰', cost: '4.100 metal', time: '—', producing: false },
  { id: 'market', name: 'Pazar Yeri', category: 'Ticaret', level: 4, maxLevel: null, desc: 'Ticaret yapmaya izin verir.', image: '🏪', cost: '2.200 metal', time: '—', producing: false },
  { id: 'research', name: 'Araştırma Merkezi', category: 'Teknoloji', level: 8, maxLevel: null, desc: 'Teknoloji araştırmalarını açar.', image: '🔬', cost: '—', time: '—', producing: false },
];

export const researches = [
  { id: 'r1', name: 'Kara Saldırı Teknolojisi', level: 4, max: 15, desc: 'Kara birliklerine +%3 saldırı bonusu', active: true, time: '04:22:15', cost: '2.800 metal · 1.200 para' },
  { id: 'r2', name: 'Üretim Hızı', level: 6, max: 15, desc: 'Tüm kaynak üretimine +%2 bonus', active: false, time: '—', cost: '3.500 metal' },
  { id: 'r3', name: 'Casusluk Etkinliği', level: 3, max: 15, desc: 'Casus operasyonlarında başarı şansı', active: false, time: '—', cost: '4.000 metal · 2.000 para' },
  { id: 'r4', name: 'Hava Savunma', level: 2, max: 15, desc: 'Hava saldırılarına karşı savunma', active: false, time: '—', cost: '5.200 metal' },
];

export const landUnits = [
  { id: 'infantry', name: 'Piyade', attack: 10, defense: 8, cost: '120 metal · 80 yemek', time: '00:08:00', count: 2400, image: '🪖', desc: 'Temel kara birliği. Özel tim ve şehir savunmasında etkili.' },
  { id: 'armor', name: 'Zırhlı Araç', attack: 25, defense: 20, cost: '450 metal · 200 yemek', time: '00:22:00', count: 380, image: '🚛', desc: 'Piyadeye karşı güçlü. Tank ve savaş uçağına zayıf.' },
  { id: 'tank', name: 'Tank', attack: 45, defense: 35, cost: '900 metal · 400 yemek · 200 yakıt', time: '00:45:00', count: 120, image: '🛡️', desc: 'Zırhlı ve piyadeye karşı güçlü.' },
  { id: 'sniper', name: 'Keskin Nişancı', attack: 30, defense: 12, cost: '350 metal · 150 yemek', time: '00:18:00', count: 85, image: '🎯', desc: 'Piyade ve özel timlere karşı etkili.' },
  { id: 'special', name: 'Özel Tim', attack: 40, defense: 25, cost: '700 metal · 300 yemek · 150 para', time: '00:35:00', count: 45, image: '⚔️', desc: 'Casusluk ve sabotaj operasyonlarında kullanılır.' },
];

export const airUnits = [
  { id: 'scout', name: 'Keşif Uçağı', attack: 0, defense: 5, cost: '200 metal · 100 yakıt', time: '00:12:00', count: 12, image: '🔭', desc: 'Keşif yapar, savaşmaz.' },
  { id: 'fighter', name: 'Savaş Uçağı', attack: 55, defense: 30, cost: '1.200 metal · 600 yakıt', time: '00:55:00', count: 28, image: '✈️', desc: 'Kara birlikleri ve gemilere karşı güçlü.' },
  { id: 'bomber', name: 'Bombardıman', attack: 70, defense: 15, cost: '1.800 metal · 900 yakıt', time: '01:10:00', count: 8, image: '💣', desc: 'Binalara ve kara birliklerine karşı etkili.' },
  { id: 'drone', name: 'Drone', attack: 20, defense: 18, cost: '400 metal · 200 yakıt', time: '00:15:00', count: 35, image: '🛸', desc: 'Piyade ve keşif uçaklarına karşı etkili.' },
];

export const seaUnits = [
  { id: 'patrol', name: 'Hücumbot', attack: 25, defense: 22, cost: '500 metal · 300 yakıt', time: '00:25:00', count: 18, image: '🚤', desc: 'Hızlı saldırı, küçük gemilere karşı.' },
  { id: 'frigate', name: 'Firkateyn', attack: 50, defense: 45, cost: '1.400 metal · 700 yakıt', time: '01:00:00', count: 6, image: '🚢', desc: 'Hücumbota ve denizaltıya karşı güçlü.' },
  { id: 'sub', name: 'Denizaltı', attack: 60, defense: 25, cost: '1.600 metal · 800 yakıt', time: '01:15:00', count: 4, image: '🔱', desc: 'Firkateyn ve uçak gemisine karşı etkili.' },
];

export const activeExpeditions = [
  { id: 1, target: 'Ankara', player: 'SteelWolf', type: 'Sefer Saldırısı', units: 850, eta: '03:42:18', distance: '520 km', cancellable: false },
  { id: 2, target: 'Bursa', player: 'KaraKurt', type: 'Sefer Saldırısı', units: 420, eta: '01:15:42', distance: '180 km', cancellable: true },
  { id: 3, target: 'Antalya', player: 'Bot_Korsan_07', type: 'Keşif', units: 50, eta: '00:28:05', distance: '95 km', cancellable: true },
];

export const pastExpeditions = [
  { id: 101, target: 'Manisa', result: 'Zafer', loot: '2.400 altın · 1.200 metal', date: '16 Mayıs 19:15' },
  { id: 102, target: 'Aydın', result: 'Yenilgi', loot: '—', date: '15 Mayıs 14:30' },
];

export const intelOps = [
  { id: 1, type: 'Keşif Ajanı', target: 'SteelWolf — Ankara', status: 'Yolda', eta: '02:10:00' },
  { id: 2, type: 'Sabotaj', target: 'BlackSea — Trabzon', status: 'Tamamlandı', result: 'Başarılı — Fabrika hasar gördü' },
];

export const tradeOffers = [
  { id: 1, seller: 'DeltaForce', sell: '5.000 Metal', want: '3.000 Yakıt', ratio: '1:0.6', distance: '340 km' },
  { id: 2, seller: 'EgeTicaret', sell: '2.000 Yemek', want: '1.500 Para', ratio: '1:0.75', distance: '45 km' },
];

export const diplomacy = {
  alliance: { name: 'Ege Komutanlığı', members: 24, mode: 'Liderli', leader: 'Komutan_Alpha' },
  treaties: [
    { type: 'Savunma Paktı', partner: 'Karadeniz Birliği', status: 'Aktif' },
    { type: 'Ateşkes', partner: 'SteelWolf', status: '48 saat kaldı' },
  ],
  votes: [{ title: 'Yeni üye: Falcon99', votes: '18/24', ends: '06:00:00' }],
};

export const reports = [
  { id: 1, type: 'Savaş', title: 'Sefer: Manisa — Zafer', date: '16 Mayıs 19:15', preview: 'Kayıp: %22 · Ganimet: 2.400 altın' },
  { id: 2, type: 'Keşif', title: 'Deniz Keşfi — Başarılı', date: '16 Mayıs 12:00', preview: 'Petrol deposu bulundu' },
  { id: 3, type: 'Casusluk', title: 'Keşif Ajanı — Yakalandı', date: '15 Mayıs 08:45', preview: 'SteelWolf sizi tespit etti' },
];

export const newsFeed = [
  { type: 'fetih', text: '[KaraKurt] İstanbul\'u fethetti!', time: '20:32' },
  { type: 'sefer', text: '[SteelWolf] Ankara\'ya sefer düzenledi, 2.400 altın ganimet aldı', time: '19:15' },
  { type: 'ittifak', text: '[NordStrike] ile [BlackSea] ittifak kurdu', time: '18:50' },
  { type: 'kayip', text: '[Falcon99] Trabzon\'u kaybetti, yeni konuma çekildi', time: '17:30' },
  { type: 'meydan', text: '[KaraKurt] Meydan Savaşı ilan etti — Hedef: Bursa', time: '16:00' },
];

export const messages = [
  { id: 1, from: 'SteelWolf', subject: 'Ateşkes teklifi', preview: '48 saatlik ateşkes öneriyorum...', unread: true, time: '14:22' },
  { id: 2, from: 'Ege Komutanlığı', subject: 'İttifak: Oylama', preview: 'Falcon99 üyelik oylaması başladı', unread: true, time: '12:05' },
  { id: 3, from: 'Sistem', subject: 'Bina tamamlandı', preview: 'Fabrika Seviye 8 yükseltmesi bitti', unread: false, time: '09:30' },
];

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
  { name: 'İzmir', owner: 'Komutan_Alpha', rank: 'Teğmen', population: 12500, type: 'Kıyı', alliance: 'Ege Komutanlığı', status: 'own', lat: 38.42, lng: 27.14 },
  { name: 'İstanbul', owner: 'KaraKurt', rank: 'Albay', population: 48000, type: 'Kıyı', alliance: 'Boğaz İmparatorluğu', status: 'enemy', lat: 41.01, lng: 28.97 },
  { name: 'Ankara', owner: 'SteelWolf', rank: 'Yüzbaşı', population: 22000, type: 'Merkez', alliance: '—', status: 'enemy', lat: 39.93, lng: 32.85 },
  { name: 'Manisa', owner: null, rank: null, population: 0, type: 'Verimli Ova', alliance: null, status: 'empty', lat: 38.62, lng: 27.43 },
  { name: 'Trabzon', owner: 'Falcon99', rank: 'Çavuş', population: 8500, type: 'Kıyı', alliance: 'Karadeniz Birliği', status: 'enemy', lat: 41.00, lng: 39.72 },
  { name: 'Bot_Kale_03', owner: 'Bot_Kale_03', rank: 'Er', population: 3200, type: 'Dağlık', alliance: null, status: 'bot', lat: 37.87, lng: 32.49 },
];

export const constructionQueue = [
  { name: 'Fabrika', level: 8, remaining: '01:45:00' },
  { name: 'Ambar', level: 6, remaining: '03:12:00', queued: true },
];

export const productionQueue = [
  { unit: 'Piyade', count: 200, remaining: '00:42:00' },
  { unit: 'Tank', count: 5, remaining: '02:15:00', queued: true },
];

export const MOBILE_NAV_ITEMS = [
  { path: '/harita', icon: '🗺️', label: 'Harita' },
  { path: '/', icon: '🏙️', label: 'Şehir' },
  { path: '/binalar', icon: '🏗️', label: 'Binalar' },
  { path: '/seferler', icon: '⚔️', label: 'Seferler' },
  { path: '/profil', icon: '👤', label: 'Profil' },
];

export const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Ana Merkez' },
  { path: '/binalar', icon: '🏗️', label: 'Binalar' },
  { path: '/arastirma', icon: '🔬', label: 'Araştırma' },
  { path: '/kisla', icon: '🪖', label: 'Kışla' },
  { path: '/hava', icon: '✈️', label: 'Hava Üssü' },
  { path: '/tersane', icon: '⚓', label: 'Tersane', coastal: true },
  { path: '/seferler', icon: '⚔️', label: 'Seferler' },
  { path: '/istihbarat', icon: '🕵️', label: 'İstihbarat' },
  { path: '/ticaret', icon: '💰', label: 'Ticaret' },
  { path: '/diplomasi', icon: '🤝', label: 'Diplomasi' },
  { path: '/raporlar', icon: '📋', label: 'Raporlar' },
  { path: '/harita', icon: '🗺️', label: 'Harita' },
  { path: '/profil', icon: '👤', label: 'Profil' },
  { path: '/mesajlar', icon: '✉️', label: 'Mesajlar' },
];
