/**
 * Natural Earth 110m ülke sınırları → public/geo/countries.json
 * shapeName / shapeISO sözleşmesi mevcut il katmanı ile aynı.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'public/geo/countries.json');

const GEO_NAME_TO_DISPLAY = {
  'United States of America': 'ABD',
  Russia: 'Rusya',
  China: 'Çin',
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
  Greece: 'Yunanistan',
  Sweden: 'İsveç',
  Vietnam: 'Vietnam',
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
  'Dominican Rep.': 'Dominik Cumhuriyeti',
  'Dominican Republic': 'Dominik Cumhuriyeti',
  Haiti: 'Haiti',
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
  'Bosnia and Herz.': 'Bosna Hersek',
  'Bosnia and Herzegovina': 'Bosna Hersek',
  'North Macedonia': 'Kuzey Makedonya',
  Montenegro: 'Karadağ',
  Kosovo: 'Kosova',
  Cyprus: 'Kıbrıs',
  Malta: 'Malta',
  'Dem. Rep. Congo': 'Kongo DR',
  'Côte d\'Ivoire': 'Fildişi Sahili',
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
  Zimbabwe: 'Zimbabve',
  Zambia: 'Zambiya',
  Botswana: 'Botsvana',
  Namibia: 'Namibya',
  Madagascar: 'Madagaskar',
  'S. Sudan': 'Güney Sudan',
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
  'Eq. Guinea': 'Ekvator Ginesi',
  'Central African Rep.': 'Orta Afrika',
  'W. Sahara': 'Batı Sahra',
  Greenland: 'Grönland',
  Pakistan: 'Pakistan',
  Turkmenistan: 'Türkmenistan',
  Tajikistan: 'Tacikistan',
  Kyrgyzstan: 'Kırgızistan',
  Nepal: 'Nepal',
  Bhutan: 'Bhutan',
  'Solomon Is.': 'Solomon Adaları',
  Fiji: 'Fiji',
  'New Caledonia': 'Yeni Kaledonya',
  'Puerto Rico': 'Porto Riko',
  Jamaica: 'Jamaika',
};

const EXCLUDED_ISO2 = new Set(['AQ', 'TF', 'BV', 'HM', 'GS', 'UM']);

function resolveDisplay(props) {
  const iso2 = String(props.ISO_A2 ?? props.iso_a2 ?? '').trim();
  if (iso2 === '-99' || !iso2) {
    const adm = props.ADMIN ?? props.NAME ?? props.name;
    return GEO_NAME_TO_DISPLAY[adm] ?? adm;
  }
  const admin = props.ADMIN ?? props.NAME ?? props.name ?? '';
  return GEO_NAME_TO_DISPLAY[admin] ?? admin;
}

function pickIso2(props) {
  let iso = String(props.ISO_A2 ?? props.iso_a2 ?? '').trim();
  if (!iso || iso === '-99') {
    iso = String(props.ISO_A3 ?? props.adm0_a3 ?? '').slice(0, 2);
  }
  return iso || 'XX';
}

console.log('Fetching Natural Earth countries…');
const res = await fetch(NE_URL);
if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
const src = await res.json();

const features = [];
const seen = new Set();

for (const feature of src.features ?? []) {
  const props = feature.properties ?? {};
  const iso2 = pickIso2(props);
  if (EXCLUDED_ISO2.has(iso2)) continue;

  const shapeName = resolveDisplay(props);
  if (!shapeName || seen.has(shapeName)) continue;
  seen.add(shapeName);

  features.push({
    type: 'Feature',
    properties: {
      shapeName,
      shapeISO: iso2,
      admin: props.ADMIN ?? props.NAME,
    },
    geometry: feature.geometry,
  });
}

// Tayvan — NE bazen Çin'e birleşik; ayrı oyun parseli
if (!seen.has('Tayvan')) {
  features.push({
    type: 'Feature',
    properties: { shapeName: 'Tayvan', shapeISO: 'TW', admin: 'Taiwan' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[120.0, 21.9], [122.0, 21.9], [122.0, 25.3], [120.0, 25.3], [120.0, 21.9]]],
    },
  });
  seen.add('Tayvan');
}

features.sort((a, b) =>
  String(a.properties.shapeName).localeCompare(String(b.properties.shapeName), 'tr'),
);

const out = { type: 'FeatureCollection', features };
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${features.length} countries → ${outPath}`);
