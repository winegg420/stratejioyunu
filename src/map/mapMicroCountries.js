/** Küçük ülke merkezleri — uzak zoom'da öncelik + büyük nokta */
export const MICRO_COUNTRY_NAMES = new Set([
  'Singapur',
  'Lüksemburg',
  'Monako',
  'Malta',
  'Bahreyn',
  'Katar',
  'Brunei',
  'Andorra',
  'San Marino',
  'Liechtenstein',
  'Vatikan',
  'Mauritius',
  'Seyşeller',
  'Maldivler',
  'Kiribati',
  'Nauru',
  'Tuvalu',
  'Palau',
  'Tonga',
  'Dominika',
  'Saint Lucia',
  'Antigua ve Barbuda',
  'Saint Kitts ve Nevis',
  'Barbados',
  'Grenada',
]);

export function isMicroCountry(name) {
  return MICRO_COUNTRY_NAMES.has(String(name ?? '').trim());
}
