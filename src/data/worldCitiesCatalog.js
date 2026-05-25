/**
 * Dünya şehir kataloğu — il/ilçe genişlemeye hazır.
 * worldRole: harita parselinin oyun rolü
 * cityRole: oyuncu üssünün rolü (yalnızca playerCities)
 */

export const WORLD_ROLES = {
  BOT_COASTAL: 'bot_coastal',
  BOT_CAPITAL: 'bot_capital',
  /** Mega Şehir — fethedilebilir, kayıt kapalı */
  MEGA_CITY: 'mega_city',
  /** Oyuncu kayıt slotu — zayıf bot, fethedilemez */
  PLAYER_SLOT: 'player_slot',
  OPEN_INLAND: 'open_inland',
  WORLD_EMPTY: 'world_empty',
  WORLD_DEMO: 'world_demo',
};

export const PLAYER_CITY_ROLES = {
  MAIN_HQ: 'main_hq',
  COLONY: 'colony',
};

/** 28 kıyı şehri — oyuncuya başlangıçta atanamaz, bot kontrolünde. */
export const COASTAL_BOT_PROVINCES = [
  'İstanbul',
  'İzmir',
  'Trabzon',
  'Samsun',
  'Antalya',
  'Mersin',
  'Adana',
  'Hatay',
  'Rize',
  'Artvin',
  'Giresun',
  'Ordu',
  'Düzce',
  'Zonguldak',
  'Bartın',
  'Kastamonu',
  'Sinop',
  'Sakarya',
  'Kırklareli',
  'Tekirdağ',
  'Kocaeli',
  'Yalova',
  'Bursa',
  'Balıkesir',
  'Çanakkale',
  'Aydın',
  'Muğla',
  'Edirne',
];

/** Başkent bot — ayrı kural seti (yüksek savunma vb. ileride). */
export const CAPITAL_BOT_PROVINCE = 'Ankara';

export const COASTAL_BOT_SET = new Set(COASTAL_BOT_PROVINCES);
export const ALL_BOT_PROVINCES = new Set([...COASTAL_BOT_PROVINCES, CAPITAL_BOT_PROVINCE]);

/**
 * İç Anadolu küçük şehir havuzu — yalnızca Ana Merkez ataması için.
 * district: ilçe genişlemesi için rezerv (şimdilik il merkezi).
 */
export const INLAND_STARTER_CITIES = [
  { name: 'Nevşehir', province: '50', provinceName: 'Nevşehir', district: 'Merkez', lat: 38.624, lng: 34.714 },
  { name: 'Niğde', province: '51', provinceName: 'Niğde', district: 'Merkez', lat: 37.966, lng: 34.679 },
  { name: 'Aksaray', province: '68', provinceName: 'Aksaray', district: 'Merkez', lat: 38.368, lng: 34.029 },
  { name: 'Karaman', province: '70', provinceName: 'Karaman', district: 'Merkez', lat: 37.181, lng: 33.215 },
  { name: 'Kırşehir', province: '40', provinceName: 'Kırşehir', district: 'Merkez', lat: 39.142, lng: 34.170 },
  { name: 'Yozgat', province: '66', provinceName: 'Yozgat', district: 'Merkez', lat: 39.818, lng: 34.815 },
  { name: 'Çankırı', province: '18', provinceName: 'Çankırı', district: 'Merkez', lat: 40.601, lng: 33.613 },
  { name: 'Kırıkkale', province: '71', provinceName: 'Kırıkkale', district: 'Merkez', lat: 39.846, lng: 33.515 },
  { name: 'Amasya', province: '05', provinceName: 'Amasya', district: 'Merkez', lat: 40.649, lng: 35.835 },
  { name: 'Konya', province: '42', provinceName: 'Konya', district: 'Merkez', lat: 37.874, lng: 32.493 },
  { name: 'Malatya', province: '44', provinceName: 'Malatya', district: 'Merkez', lat: 38.355, lng: 38.309 },
  { name: 'Sivas', province: '58', provinceName: 'Sivas', district: 'Merkez', lat: 39.748, lng: 37.016 },
];

export const INLAND_STARTER_BY_PROVINCE = new Map(
  INLAND_STARTER_CITIES.map((c) => [c.provinceName, c]),
);

/**
 * Küresel harita — oyuncu başlangıç havuzu (Mega olmayan ülkeler).
 * GeoJSON yüklenmeden önce pickMainHqStarter için kullanılır.
 */
export const WORLD_PLAYER_STARTERS = [
  { name: 'Polonya', provinceName: 'Polonya', province: 'PL', lat: 52.0, lng: 19.0 },
  { name: 'İtalya', provinceName: 'İtalya', province: 'IT', lat: 41.9, lng: 12.5 },
  { name: 'Brezilya', provinceName: 'Brezilya', province: 'BR', lat: -14.2, lng: -51.9 },
  { name: 'Hindistan', provinceName: 'Hindistan', province: 'IN', lat: 20.6, lng: 78.9 },
  { name: 'Kanada', provinceName: 'Kanada', province: 'CA', lat: 56.1, lng: -106.3 },
  { name: 'Avustralya', provinceName: 'Avustralya', province: 'AU', lat: -25.3, lng: 133.8 },
  { name: 'Mısır', provinceName: 'Mısır', province: 'EG', lat: 26.8, lng: 30.8 },
  { name: 'Endonezya', provinceName: 'Endonezya', province: 'ID', lat: -0.8, lng: 113.9 },
  { name: 'Güney Kore', provinceName: 'Güney Kore', province: 'KR', lat: 35.9, lng: 127.8 },
  { name: 'Norveç', provinceName: 'Norveç', province: 'NO', lat: 60.5, lng: 8.5 },
  { name: 'Finlandiya', provinceName: 'Finlandiya', province: 'FI', lat: 61.9, lng: 25.7 },
  { name: 'Romanya', provinceName: 'Romanya', province: 'RO', lat: 45.9, lng: 24.9 },
];

/** Admin panelinden yönetilecek varsayılan oyun yapılandırması. */
export const DEFAULT_GAME_CONFIG = {
  serverId: 'global-1',
  mapMode: 'world',
  /** Oyuncunun koloni kurabileceği ülkeler — Mega hariç hepsi */
  playerOpenProvinces: 'all_non_mega',
  coastalBotsEnabled: true,
  capitalBotEnabled: true,
  inlandStartersEnabled: true,
  /** Aktif dünya ülke üst sınırı */
  maxActiveWorldSlots: 175,
  districtExpansionReady: true,
};
