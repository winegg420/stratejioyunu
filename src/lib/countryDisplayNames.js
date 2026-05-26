import { GEO_NAME_TO_DISPLAY, ISO_TO_DISPLAY } from '../data/worldCountriesCatalog';

/** Oyuncu arayüzü dili — LanguageProvider senkronize eder */
let uiLang = 'tr';

export function setUiLangForCountries(lang) {
  uiLang = lang === 'en' ? 'en' : 'tr';
}

export function getUiLangForCountries() {
  return uiLang;
}

/** Türkçe kısaltmalar / özel adlar → resmi İngilizce */
const TR_TO_EN_OVERRIDES = {
  ABD: 'United States',
  BAE: 'United Arab Emirates',
  Türkiye: 'Turkey',
  İngiltere: 'United Kingdom',
  Çin: 'China',
  Rusya: 'Russia',
  Almanya: 'Germany',
  Fransa: 'France',
  İspanya: 'Spain',
  Japonya: 'Japan',
  Hollanda: 'Netherlands',
  İsviçre: 'Switzerland',
  Yunanistan: 'Greece',
  İsveç: 'Sweden',
  Norveç: 'Norway',
  Finlandiya: 'Finland',
  Polonya: 'Poland',
  İtalya: 'Italy',
  Brezilya: 'Brazil',
  Hindistan: 'India',
  Kanada: 'Canada',
  Avustralya: 'Australia',
  Mısır: 'Egypt',
  Endonezya: 'Indonesia',
  'Güney Kore': 'South Korea',
  'Kuzey Kore': 'North Korea',
  'Suudi Arabistan': 'Saudi Arabia',
  İran: 'Iran',
  Irak: 'Iraq',
  Arjantin: 'Argentina',
  Kolombiya: 'Colombia',
  Meksika: 'Mexico',
  Küba: 'Cuba',
  Vietnam: 'Vietnam',
  Tayvan: 'Taiwan',
  İsrail: 'Israel',
  Ukrayna: 'Ukraine',
  Romanya: 'Romania',
  Macaristan: 'Hungary',
  Çekya: 'Czechia',
  Belçika: 'Belgium',
  Avusturya: 'Austria',
  Portekiz: 'Portugal',
  İrlanda: 'Ireland',
  Danimarka: 'Denmark',
  Fas: 'Morocco',
  Cezayir: 'Algeria',
  Nijerya: 'Nigeria',
  'Güney Afrika': 'South Africa',
  'Kongo DR': 'Democratic Republic of the Congo',
  'Fildişi Sahili': "Côte d'Ivoire",
  Kamerun: 'Cameroon',
  Kenya: 'Kenya',
  Etiyopya: 'Ethiopia',
  Tanzanya: 'Tanzania',
  Angola: 'Angola',
  Mozambik: 'Mozambique',
  Sudan: 'Sudan',
  'Güney Sudan': 'South Sudan',
  Şili: 'Chile',
  Peru: 'Peru',
  Venezuela: 'Venezuela',
  Bolivya: 'Bolivia',
  Paraguay: 'Paraguay',
  Uruguay: 'Uruguay',
  Ekvador: 'Ecuador',
  Guatemala: 'Guatemala',
  Honduras: 'Honduras',
  Nikaragua: 'Nicaragua',
  'Kosta Rika': 'Costa Rica',
  Panama: 'Panama',
  'Dominik Cumhuriyeti': 'Dominican Republic',
  Haiti: 'Haiti',
  'Porto Riko': 'Puerto Rico',
  Jamaika: 'Jamaica',
  İzlanda: 'Iceland',
  Lüksemburg: 'Luxembourg',
  Slovakya: 'Slovakia',
  Slovenya: 'Slovenia',
  Litvanya: 'Lithuania',
  Letonya: 'Latvia',
  Estonya: 'Estonia',
  Belarus: 'Belarus',
  Moldova: 'Moldova',
  Arnavutluk: 'Albania',
  'Bosna Hersek': 'Bosnia and Herzegovina',
  'Kuzey Makedonya': 'North Macedonia',
  Karadağ: 'Montenegro',
  Kosova: 'Kosovo',
  Kıbrıs: 'Cyprus',
  Malta: 'Malta',
  Sırbistan: 'Serbia',
  Hırvatistan: 'Croatia',
  Bulgaristan: 'Bulgaria',
  Kazakistan: 'Kazakhstan',
  Özbekistan: 'Uzbekistan',
  Azerbaycan: 'Azerbaijan',
  Gürcistan: 'Georgia',
  Ermenistan: 'Armenia',
  Suriye: 'Syria',
  Lübnan: 'Lebanon',
  Ürdün: 'Jordan',
  Bangladeş: 'Bangladesh',
  Nepal: 'Nepal',
  Moğolistan: 'Mongolia',
  Libya: 'Libya',
  Tunus: 'Tunisia',
  Gana: 'Ghana',
  Zimbabve: 'Zimbabwe',
  Zambiya: 'Zambia',
  Botsvana: 'Botswana',
  Namibya: 'Namibia',
  Madagaskar: 'Madagascar',
  Ruanda: 'Rwanda',
  Burundi: 'Burundi',
  Uganda: 'Uganda',
  Liberya: 'Liberia',
  Gine: 'Guinea',
  'Burkina Faso': 'Burkina Faso',
  Benin: 'Benin',
  Togo: 'Togo',
  Gabon: 'Gabon',
  'Ekvator Ginesi': 'Equatorial Guinea',
  'Orta Afrika': 'Central African Republic',
  'Batı Sahra': 'Western Sahara',
  Grönland: 'Greenland',
  Pakistan: 'Pakistan',
  Afganistan: 'Afghanistan',
  Türkmenistan: 'Turkmenistan',
  Tacikistan: 'Tajikistan',
  Kırgızistan: 'Kyrgyzstan',
  Bhutan: 'Bhutan',
  'Solomon Adaları': 'Solomon Islands',
  Fiji: 'Fiji',
  'Yeni Zelanda': 'New Zealand',
  'Yeni Kaledonya': 'New Caledonia',
  Malezya: 'Malaysia',
  Tayland: 'Thailand',
  Filipinler: 'Philippines',
  Katar: 'Qatar',
  Kuveyt: 'Kuwait',
  Bahreyn: 'Bahrain',
  Umman: 'Oman',
  Yemen: 'Yemen',
  Somali: 'Somalia',
  Çad: 'Chad',
  Nijer: 'Niger',
  Mali: 'Mali',
  Senegal: 'Senegal',
  Kamboçya: 'Cambodia',
  Laos: 'Laos',
  'Papua Yeni Gine': 'Papua New Guinea',
  Myanmar: 'Myanmar',
  'Sri Lanka': 'Sri Lanka',
  Singapur: 'Singapore',
  'Marmara Bölgesi': 'Marmara Region',
  'Ege Bölgesi': 'Aegean Region',
  'İç Anadolu': 'Central Anatolia',
  'Karadeniz Bölgesi': 'Black Sea Region',
  'Akdeniz Bölgesi': 'Mediterranean Region',
};

function buildTrToEnFromCatalog() {
  const map = { ...TR_TO_EN_OVERRIDES };
  for (const [en, tr] of Object.entries(GEO_NAME_TO_DISPLAY)) {
    if (!tr) continue;
    const prev = map[tr];
    if (!prev || en.length > prev.length) {
      map[tr] = en;
    }
  }
  for (const tr of Object.values(ISO_TO_DISPLAY)) {
    if (map[tr]) continue;
    const match = Object.entries(GEO_NAME_TO_DISPLAY).find(([, v]) => v === tr);
    if (match) map[tr] = match[0];
  }
  return map;
}

const TR_TO_EN = buildTrToEnFromCatalog();

const EN_TO_TR = (() => {
  const map = new Map();
  for (const [en, tr] of Object.entries(GEO_NAME_TO_DISPLAY)) {
    if (!en || !tr) continue;
    map.set(en, tr);
    map.set(en.toLowerCase(), tr);
  }
  return map;
})();

const HAS_TR_CHARS = /[ğüşöçıİĞÜŞÖÇ]/;

function resolveCanonicalTurkishName(name) {
  const raw = String(name ?? '').trim();
  if (!raw) return '';
  if (HAS_TR_CHARS.test(raw)) return raw;
  return EN_TO_TR.get(raw) ?? EN_TO_TR.get(raw.toLowerCase()) ?? raw;
}

/**
 * Ülke / bölge görünen adı (oyun içi kanonik TR adından).
 * @param {string} canonicalTr — shapeName veya şehir adı (TR)
 * @param {'tr'|'en'} [lang]
 */
export function getCountryDisplayLabel(canonicalTr, lang = uiLang) {
  const tr = resolveCanonicalTurkishName(canonicalTr);
  if (!tr) return '';
  if (lang !== 'en') return tr;
  if (tr === 'Bölge') return 'Region';
  if (tr === 'Üs') return 'Base';
  if (TR_TO_EN[tr]) return TR_TO_EN[tr];
  if (!HAS_TR_CHARS.test(tr)) return tr;
  return tr;
}

/** Harita araması — TR kanonik ad veya İngilizce görünen ad */
export function countryNameMatchesQuery(canonicalTr, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return true;
  const trName = resolveCanonicalTurkishName(canonicalTr);
  if (trName.toLowerCase().includes(q)) return true;
  const raw = String(canonicalTr ?? '').trim().toLowerCase();
  if (raw.includes(q)) return true;
  return getCountryDisplayLabel(canonicalTr, 'en').toLowerCase().includes(q);
}

/** GeoJSON feature özelliklerinden görünen ülke adı */
export function getCountryLabelFromFeature(feature, lang = uiLang) {
  const props = feature?.properties ?? {};
  const tr = props.shapeName ?? props.ADMIN ?? props.NAME ?? '';
  if (lang === 'en' && props.shapeNameEn) return props.shapeNameEn;
  return getCountryDisplayLabel(tr, lang);
}
