import { CONSTRUCTION_QUEUE_LIMIT } from './gameConstants';
import {
  getColonyCount,
  getEmpireHqLevel,
  getMaxCitySlots,
  getOwnedCityCount,
} from './empireExpansion';
import { isMainHqCity } from './worldCitySystem';

export function isCoastalPlayerCity(playerCity) {
  if (!playerCity) return false;
  if (playerCity.isCoastal === true) return true;
  const type = String(playerCity.type ?? '');
  return type.includes('Kıyı') || type.toLowerCase().includes('kiyi');
}

export function formatCityBaseName(city) {
  if (city.province) return `${city.name} (${city.province})`;
  if (city.provinceName) return `${city.name} (${city.provinceName})`;
  return city.name;
}

export function formatCityOptionLabel(city, t) {
  const base = formatCityBaseName(city);
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

export function getConstructionQueueSummary(city) {
  const queue = city?.constructionQueue ?? [];
  const active = queue.filter((q) => !q.queued).length;
  const queued = queue.filter((q) => q.queued).length;
  const total = queue.length;
  return {
    active,
    queued,
    total,
    activeCount: active > 0 ? 1 : 0,
    limit: CONSTRUCTION_QUEUE_LIMIT,
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
