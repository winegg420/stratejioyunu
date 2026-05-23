import tr from './locales/tr';
import en from './locales/en';

export const LANG_STORAGE_KEY = 'strateji_lang';
export const SUPPORTED_LANGS = ['tr', 'en'];

const LOCALES = { tr, en };

export function getLocale(lang) {
  return LOCALES[lang === 'en' ? 'en' : 'tr'] ?? tr;
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

export function translate(lang, key, vars = {}) {
  const locale = getLocale(lang);
  let text = getByPath(locale, key);
  if (text == null && lang === 'en') {
    const trText = getByPath(tr, key);
    if (trText != null && import.meta.env?.DEV) {
      console.warn(`[i18n] EN missing key "${key}" — add to extra/en.js (TR: "${String(trText).slice(0, 48)}…")`);
    }
    text = trText;
  }
  if (text == null) {
    text = getByPath(tr, key);
  }
  if (text == null) return key;
  if (typeof text !== 'string') return key;
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) => (
    vars[name] != null ? String(vars[name]) : `{{${name}}}`
  ));
}

export function resourceLabel(lang, resourceId) {
  const id = resourceId === 'metal' ? 'hammadde' : resourceId;
  return translate(lang, `resource.${id}`) || id;
}

export {
  localizedBuildingLabel,
  localizedResearchName,
  localizedResearchDesc,
  localizedUnitName,
} from './displayLabels';
