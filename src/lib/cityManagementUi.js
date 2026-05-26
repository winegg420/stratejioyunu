import { translate } from '../i18n';
import { getCountryDisplayLabel } from './countryDisplayNames';
import { CONSTRUCTION_QUEUE_LIMIT } from './gameConstants';
import { getConstructionQueueLimit } from './premiumDiamonds';
import {
  getColonyCount,
  getEmpireHqLevel,
  getMaxCitySlots,
  getOwnedCityCount,
} from './empireExpansion';
import { loadGameConfig } from './gameConfig';
import { isWorldCountryCoastal } from '../data/worldCountriesCatalog';
import { isMainHqCity, isWorldMapMode } from './worldCitySystem';

export function isCoastalPlayerCity(playerCity) {
  if (!playerCity) return false;
  if (isWorldMapMode(loadGameConfig())) {
    return isWorldCountryCoastal(playerCity.provinceName ?? playerCity.name);
  }
  if (playerCity.isCoastal === true) return true;
  const type = String(playerCity.type ?? '');
  return type.includes('Kıyı') || type.toLowerCase().includes('kiyi');
}

function isIsoTerritoryCode(value) {
  const code = String(value ?? '').trim();
  return /^[A-Za-z]{2,3}$/.test(code);
}

export function formatCityBaseName(city, lang = 'tr') {
  const name = getCountryDisplayLabel(city?.name, lang);
  const province = getCountryDisplayLabel(city?.provinceName, lang);
  if (
    city?.province
    && city.province !== city?.name
    && !isIsoTerritoryCode(city.province)
  ) {
    const provLabel = getCountryDisplayLabel(city.province, lang);
    if (provLabel && provLabel !== name && !isIsoTerritoryCode(provLabel)) {
      return `${name} (${provLabel})`;
    }
  }
  if (province && province !== name && !isIsoTerritoryCode(province)) {
    return `${name} (${province})`;
  }
  return name;
}

/** Ana merkez / özet — şehir adı tekrarlanmaz (provinceName === name ise atlanır). */
export function formatCitySubtitle(city, lang = 'tr') {
  if (!city) return '—';
  const name = getCountryDisplayLabel(city.name, lang) || '—';
  const type = city.type ?? translate(lang, 'pages.home.feed.base');
  const province = getCountryDisplayLabel(city.provinceName, lang);
  if (province && province !== name) {
    return `${name} · ${type} · ${province}`;
  }
  return `${name} · ${type}`;
}

export function formatCityOptionLabel(city, t, lang = 'tr') {
  const base = formatCityBaseName(city, lang);
  if (isMainHqCity(city)) {
    return t ? t('cityManagement.cityLabelMainHq', { name: base }) : `★ ${base} — Ana Merkez`;
  }
  return t ? t('cityManagement.cityLabelColony', { name: base }) : `◆ ${base}`;
}

export function getEmpireSlotSummary(state) {
  const hqLevel = getEmpireHqLevel(state);
  const owned = getOwnedCityCount(state);
  const maxSlots = getMaxCitySlots(hqLevel);
  const colonies = getColonyCount(state);
  return { hqLevel, owned, maxSlots, colonies };
}

export function getConstructionQueueSummary(city, playerMeta = null) {
  const queue = city?.constructionQueue ?? [];
  const active = queue.filter((q) => !q.queued).length;
  const queued = queue.filter((q) => q.queued).length;
  const total = queue.length;
  const limit = playerMeta ? getConstructionQueueLimit(playerMeta) : CONSTRUCTION_QUEUE_LIMIT;
  return {
    active,
    queued,
    total,
    activeCount: active > 0 ? 1 : 0,
    limit,
  };
}

/** Nüfus: toplam (gıda), işgücü havuzu, garnizon asker, işsiz tahmini */
export function getPopulationBreakdown(city) {
  const food = city?.resources?.find((r) => r.id === 'food');
  const total = Math.floor(food?.current ?? city?.population ?? 0);
  const workforce = Math.max(0, Math.floor(city?.idlePopulation ?? 0));
  const military = (city?.idleTroops ?? []).reduce(
    (sum, t) => sum + Math.max(0, Number(t.available) || 0),
    0,
  );
  const employed = Math.min(workforce, total);
  const militaryCapped = Math.min(military, Math.max(0, total - employed));
  const unemployed = Math.max(0, total - employed - militaryCapped);

  const segments = [
    { id: 'Workforce', value: employed, color: '#00ffcc' },
    { id: 'Military', value: militaryCapped, color: '#39ff14' },
    { id: 'Unemployed', value: unemployed, color: '#94a3b8' },
  ].filter((s) => s.value > 0);

  const denom = total || 1;
  return {
    total,
    segments: segments.map((s) => ({
      ...s,
      pct: Math.round((s.value / denom) * 100),
    })),
  };
}
