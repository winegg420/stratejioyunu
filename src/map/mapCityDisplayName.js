import { stripBotCitySuffix } from '../lib/botProvinceAssignment';
import {
  getCountryDisplayLabel,
  getUiLangForCountries,
} from '../lib/countryDisplayNames';

/** Harita etiketlerinde gösterilecek şehir/ülke adı — [BOT] soneki gizlenir, dil duyarlı */
export function getMapCityDisplayName(name, lang = getUiLangForCountries()) {
  const cleaned = stripBotCitySuffix(name);
  return getCountryDisplayLabel(cleaned, lang);
}
