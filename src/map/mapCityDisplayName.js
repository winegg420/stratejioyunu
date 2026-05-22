import { stripBotCitySuffix } from '../lib/botProvinceAssignment';

/** Harita etiketlerinde gösterilecek şehir adı — [BOT] soneki gizlenir */
export function getMapCityDisplayName(name) {
  const cleaned = stripBotCitySuffix(name);
  return cleaned || String(name ?? '').trim();
}
