/**
 * Küresel harita — ülke kataloğu (Mega Şehirler + oynanabilir ülkeler).
 * shapeName = harita/oyun içi görünen ad (Türkçe).
 */

/** Kayıt kapalı — yalnızca fethedilebilir Mega Şehirler (23). */
export const MEGA_CITIES = [
  'Kolombiya',
  'Meksika',
  'Jamaika',
  'Hollanda',
  'İsrail',
  'Tayvan',
  'İsviçre',
  'Singapur',
  'Kuzey Kore',
  'Ukrayna',
  'Türkiye',
  'Yunanistan',
  'İsveç',
  'Vietnam',
  'Küba',
  'ABD',
  'Rusya',
  'Çin',
  'Almanya',
  'Fransa',
  'İspanya',
  'İngiltere',
  'Japonya',
];

export const MEGA_CITIES_SET = new Set(MEGA_CITIES);

/** Natural Earth / ISO isim → oyun içi shapeName */
export const GEO_NAME_TO_DISPLAY = {
  'United States of America': 'ABD',
  'United States': 'ABD',
  'U.S.A.': 'ABD',
  Russia: 'Rusya',
  'Russian Federation': 'Rusya',
  China: 'Çin',
  'People\'s Republic of China': 'Çin',
  Germany: 'Almanya',
  France: 'Fransa',
  Spain: 'İspanya',
  'United Kingdom': 'İngiltere',
  Japan: 'Japonya',
  Colombia: 'Kolombiya',
  Mexico: 'Meksika',
  Jamaica: 'Jamaika',
  Netherlands: 'Hollanda',
  Israel: 'İsrail',
  Taiwan: 'Tayvan',
  Switzerland: 'İsviçre',
  Singapore: 'Singapur',
  'North Korea': 'Kuzey Kore',
  Ukraine: 'Ukrayna',
  Turkey: 'Türkiye',
  Türkiye: 'Türkiye',
  Greece: 'Yunanistan',
  Sweden: 'İsveç',
  Vietnam: 'Vietnam',
  'Viet Nam': 'Vietnam',
  Cuba: 'Küba',
  Brazil: 'Brezilya',
  India: 'Hindistan',
  Canada: 'Kanada',
  Australia: 'Avustralya',
  Egypt: 'Mısır',
  'South Africa': 'Güney Afrika',
  Nigeria: 'Nijerya',
  Argentina: 'Arjantin',
  Poland: 'Polonya',
  Italy: 'İtalya',
  'South Korea': 'Güney Kore',
  'Korea, South': 'Güney Kore',
  Indonesia: 'Endonezya',
  'Saudi Arabia': 'Suudi Arabistan',
  Iran: 'İran',
  Iraq: 'Irak',
  Pakistan: 'Pakistan',
  Afghanistan: 'Afganistan',
  Norway: 'Norveç',
  Finland: 'Finlandiya',
  Denmark: 'Danimarka',
  Belgium: 'Belçika',
  Austria: 'Avusturya',
  Portugal: 'Portekiz',
  Ireland: 'İrlanda',
  'New Zealand': 'Yeni Zelanda',
  Morocco: 'Fas',
  Algeria: 'Cezayir',
  Kenya: 'Kenya',
  Ethiopia: 'Etiyopya',
  Thailand: 'Tayland',
  Malaysia: 'Malezya',
  Philippines: 'Filipinler',
  'United Arab Emirates': 'BAE',
  Qatar: 'Katar',
  Chile: 'Şili',
  Peru: 'Peru',
  Venezuela: 'Venezuela',
  Romania: 'Romanya',
  Hungary: 'Macaristan',
  'Czech Republic': 'Çekya',
  Czechia: 'Çekya',
  Serbia: 'Sırbistan',
  Croatia: 'Hırvatistan',
  Bulgaria: 'Bulgaristan',
  Kazakhstan: 'Kazakistan',
  Uzbekistan: 'Özbekistan',
  Azerbaijan: 'Azerbaycan',
  Georgia: 'Gürcistan',
  Armenia: 'Ermenistan',
  Syria: 'Suriye',
  Lebanon: 'Lübnan',
  Jordan: 'Ürdün',
  'Sri Lanka': 'Sri Lanka',
  Myanmar: 'Myanmar',
  Bangladesh: 'Bangladeş',
  Nepal: 'Nepal',
  Mongolia: 'Moğolistan',
  Libya: 'Libya',
  Tunisia: 'Tunus',
  Ghana: 'Gana',
  Tanzania: 'Tanzanya',
  Angola: 'Angola',
  Mozambique: 'Mozambik',
  Sudan: 'Sudan',
  Bolivia: 'Bolivya',
  Paraguay: 'Paraguay',
  Uruguay: 'Uruguay',
  Ecuador: 'Ekvador',
  Guatemala: 'Guatemala',
  Honduras: 'Honduras',
  Nicaragua: 'Nikaragua',
  'Costa Rica': 'Kosta Rika',
  Panama: 'Panama',
  'Dominican Republic': 'Dominik Cumhuriyeti',
  Haiti: 'Haiti',
  'Puerto Rico': 'Porto Riko',
  Iceland: 'İzlanda',
  Luxembourg: 'Lüksemburg',
  Slovakia: 'Slovakya',
  Slovenia: 'Slovenya',
  Lithuania: 'Litvanya',
  Latvia: 'Letonya',
  Estonia: 'Estonya',
  Belarus: 'Belarus',
  Moldova: 'Moldova',
  Albania: 'Arnavutluk',
  'Bosnia and Herzegovina': 'Bosna Hersek',
  'North Macedonia': 'Kuzey Makedonya',
  Montenegro: 'Karadağ',
  Kosovo: 'Kosova',
  Cyprus: 'Kıbrıs',
  Malta: 'Malta',
  'Dem. Rep. Congo': 'Kongo DR',
  'Democratic Republic of the Congo': 'Kongo DR',
  'Côte d\'Ivoire': 'Fildişi Sahili',
  "Cote d'Ivoire": 'Fildişi Sahili',
  'Ivory Coast': 'Fildişi Sahili',
  'Northern Cyprus': 'Kuzey Kıbrıs',
  Cameroon: 'Kamerun',
  Senegal: 'Senegal',
  Mali: 'Mali',
  Niger: 'Nijer',
  Chad: 'Çad',
  Somalia: 'Somali',
  Yemen: 'Yemen',
  Oman: 'Umman',
  Kuwait: 'Kuveyt',
  Bahrain: 'Bahreyn',
  Cambodia: 'Kamboçya',
  Laos: 'Laos',
  'Papua New Guinea': 'Papua Yeni Gine',
  'New Caledonia': 'Yeni Kaledonya',
  Zimbabwe: 'Zimbabve',
  Zambia: 'Zambiya',
  Botswana: 'Botsvana',
  Namibia: 'Namibya',
  Madagascar: 'Madagaskar',
  'South Sudan': 'Güney Sudan',
  Rwanda: 'Ruanda',
  Burundi: 'Burundi',
  Uganda: 'Uganda',
  'Sierra Leone': 'Sierra Leone',
  Liberia: 'Liberya',
  Guinea: 'Gine',
  'Burkina Faso': 'Burkina Faso',
  Benin: 'Benin',
  Togo: 'Togo',
  Gabon: 'Gabon',
  'Equatorial Guinea': 'Ekvator Ginesi',
  'Central African Rep.': 'Orta Afrika',
  'Central African Republic': 'Orta Afrika',
  'W. Sahara': 'Batı Sahra',
  'Western Sahara': 'Batı Sahra',
  Greenland: 'Grönland',
};

/** ISO_A2 / ISO_A3 alternatifleri */
export const ISO_TO_DISPLAY = {
  US: 'ABD',
  USA: 'ABD',
  RU: 'Rusya',
  CN: 'Çin',
  DE: 'Almanya',
  FR: 'Fransa',
  ES: 'İspanya',
  GB: 'İngiltere',
  UK: 'İngiltere',
  JP: 'Japonya',
  TR: 'Türkiye',
  TW: 'Tayvan',
  KP: 'Kuzey Kore',
  KR: 'Güney Kore',
};

/** shapeName (Türkçe) → ISO2 */
const DISPLAY_NAME_TO_ISO = Object.entries(ISO_TO_DISPLAY).reduce((acc, [iso, name]) => {
  if (!acc[name]) acc[name] = iso.length === 2 ? iso : iso;
  return acc;
}, {});

export function resolveCountryIso2(countryName, shapeIso = '') {
  const raw = String(shapeIso ?? '').trim().toUpperCase();
  if (raw.length === 2 && ISO_TO_DISPLAY[raw]) return raw;
  const m = raw.match(/(?:^|[-:])([A-Z]{2})$/);
  if (m?.[1] && ISO_TO_DISPLAY[m[1]]) return m[1];
  const name = String(countryName ?? '').trim();
  return DISPLAY_NAME_TO_ISO[name] ?? '';
}

export function resolveCountryDisplayName(rawName, iso2 = '') {
  const trimmed = String(rawName ?? '').trim();
  if (!trimmed && !iso2) return '';
  if (ISO_TO_DISPLAY[iso2]) return ISO_TO_DISPLAY[iso2];
  if (GEO_NAME_TO_DISPLAY[trimmed]) return GEO_NAME_TO_DISPLAY[trimmed];
  return trimmed;
}

export function isMegaCity(countryName) {
  return MEGA_CITIES_SET.has(String(countryName ?? '').trim());
}

export function isPlayerRegisterableCountry(countryName) {
  const name = String(countryName ?? '').trim();
  return name.length > 0 && !MEGA_CITIES_SET.has(name);
}

/** Tersane / deniz üretimi — kıyı erişimi olmayan ülkeler (küresel harita). */
export const LANDLOCKED_WORLD_COUNTRIES = new Set([
  'İsviçre', 'Avusturya', 'Çekya', 'Macaristan', 'Slovakya', 'Slovenya',
  'Moğolistan', 'Nepal', 'Bolivya', 'Paraguay', 'Afganistan', 'Ermenistan',
  'Laos', 'Botsvana', 'Zambiya', 'Zimbabve', 'Ruanda', 'Burundi', 'Uganda',
  'Mali', 'Nijer', 'Çad', 'Burkina Faso', 'Benin', 'Togo', 'Kazakistan',
  'Özbekistan', 'Türkmenistan', 'Kırgızistan', 'Tacikistan',
]);

/** Bilinen kıyı ülkeleri (oyuncu başlangıç havuzu dahil — Mısır, İtalya, …). */
export const COASTAL_WORLD_COUNTRIES = new Set([
  'Mısır', 'Polonya', 'İtalya', 'Brezilya', 'Hindistan', 'Kanada', 'Avustralya',
  'Endonezya', 'Güney Kore', 'Norveç', 'Finlandiya', 'Romanya', 'Türkiye',
  'Yunanistan', 'ABD', 'Rusya', 'Çin', 'Almanya', 'Fransa', 'İspanya',
  'İngiltere', 'Japonya', 'Hollanda', 'İsrail', 'Tayvan', 'Singapur',
  'Ukrayna', 'Vietnam', 'Küba', 'Kolombiya', 'Meksika', 'Jamaika', 'İsveç',
  'Portekiz', 'Yeni Zelanda', 'Güney Afrika', 'Nijerya', 'Arjantin', 'Şili',
  'Peru', 'Venezuela', 'Suudi Arabistan', 'İran', 'Irak', 'Pakistan',
  'Bangladeş', 'Tayland', 'Malezya', 'Filipinler', 'BAE', 'Katar', 'Kuveyt',
  'Bahreyn', 'Umman', 'Yemen', 'Fas', 'Cezayir', 'Tunus', 'Libya', 'Kenya',
  'Tanzanya', 'Angola', 'Mozambik', 'Sudan', 'Güney Sudan', 'Gana', 'Senegal',
  'Kamerun', 'Kongo DR', 'Fildişi Sahili', 'Etiyopya', 'Somali', 'Ekvador',
  'Uruguay', 'Panama', 'Kosta Rika', 'Dominik Cumhuriyeti', 'Haiti',
  'Guatemala', 'Honduras', 'Nikaragua', 'İrlanda', 'İzlanda', 'Danimarka',
  'Belçika', 'Hırvatistan', 'Bulgaristan', 'Gürcistan', 'Azerbaycan',
  'Lübnan', 'Ürdün', 'Sri Lanka', 'Myanmar', 'Kamboçya', 'Papua Yeni Gine',
  'Madagaskar', 'Namibya', 'Gabon', 'Kıbrıs', 'Malta', 'Grönland',
]);

/** Ülkenin tersane / deniz birimi üretebilmesi için kıyı erişimi. */
export function isWorldCountryCoastal(countryName) {
  const display = resolveCountryDisplayName(countryName) || String(countryName ?? '').trim();
  if (!display) return false;
  if (LANDLOCKED_WORLD_COUNTRIES.has(display)) return false;
  if (COASTAL_WORLD_COUNTRIES.has(display)) return true;
  return isPlayerRegisterableCountry(display);
}

/** Küçük / önemsiz adalar — GeoJSON üretiminde hariç tutulabilir */
export const EXCLUDED_ISO2 = new Set([
  'AQ', // Antarktika
  'TF', // French Southern Territories
  'BV', // Bouvet
  'HM', // Heard/McDonald
  'GS', // South Georgia
  'UM', // US Minor Outlying
]);
