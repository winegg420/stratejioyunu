import { translate } from './index';

export function localizedBuildingLabel(lang, id, fallback) {
  const key = `catalog.buildings.${id}`;
  const text = translate(lang, key);
  return text !== key ? text : (fallback ?? id);
}

export function localizedResearchName(lang, id, fallback) {
  const key = `catalog.research.${id}.name`;
  const text = translate(lang, key);
  return text !== key ? text : (fallback ?? id);
}

export function localizedResearchDesc(lang, id, fallback) {
  const key = `catalog.research.${id}.desc`;
  const text = translate(lang, key);
  return text !== key ? text : (fallback ?? '');
}

export function localizedUnitName(lang, id, fallback) {
  const key = `catalog.units.${id}.name`;
  const text = translate(lang, key);
  return text !== key ? text : (fallback ?? id);
}
