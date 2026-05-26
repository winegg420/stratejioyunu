/**
 * Geçici geliştirici / admin solo-test modu.
 * - VITE_DEV_TEST_MODE=true veya local dev build (VITE_DEV_TEST_MODE !== 'false')
 * - localStorage: strateji_dev_test=1
 */
import { buildings as buildingDefs, landUnits, airUnits, seaUnits } from '../data/placeholder';
import { RESOURCE_CATALOG, RESOURCE_IDS, ensureCityResources } from '../data/resourceCatalog';
import { createStarterBuildings, createStarterResearches, getStarterResources } from './buildingUtils';
import { createCityState } from '../data/gameInit';
import { getUnitDisplayName } from '../data/unitCatalog';
import { CYBER_ABILITIES } from './cyberOps';
import { MIL_AI_TUTORIAL_QUEST_IDS } from './milAiTutorialQuests';

export const DEV_TEST_BUILDING_LEVEL = 15;
export const DEV_TEST_RESEARCH_LEVEL = 15;
export const DEV_TEST_UNIT_QTY = 100;
export const DEV_TEST_SPY_QTY = 100;
export const DEV_TEST_AGENT_QTY = 100;
export const DEV_TEST_RESOURCE_FILL = 50000;

const DEV_LS_KEY = 'strateji_dev_test';
const DEV_ADMIN_LS_KEY = 'strateji_dev_admin';

const ALL_COMBAT_UNIT_DEFS = [...landUnits, ...airUnits, ...seaUnits];

export function isDevAdminLocalEnabled() {
  try {
    return localStorage.getItem(DEV_ADMIN_LS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Admin test boost yalnızca açıkça etkinleştirildiğinde.
 * Prod: strateji_dev_admin=1 (Admin Log → Admin moduna geç).
 * Yerel dev: VITE_DEV_TEST_MODE veya strateji_dev_test=1.
 */
export function isDevTestMode() {
  if (isDevAdminLocalEnabled()) return true;
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_DEV_TEST_MODE === 'false') return false;
  if (import.meta.env.VITE_DEV_TEST_MODE === 'true') return true;
  try {
    return localStorage.getItem(DEV_LS_KEY) === '1';
  } catch {
    return false;
  }
}

/** Prod oturumunda eski dev bayraklarını temizle (admin kapalıyken). */
export function purgeStaleDevTestFlags() {
  if (import.meta.env.DEV) return;
  if (isDevAdminLocalEnabled()) return;
  setDevTestModeLocal(false);
}

/** Geliştirici test modunu kapatır (bir kerelik temizlik). */
export function disableDevTestModeLocal() {
  setDevTestModeLocal(false);
}

export function setDevTestModeLocal(enabled) {
  try {
    localStorage.setItem(DEV_LS_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function bypassWarLocksForDevTest() {
  return isDevTestMode();
}

function resolveDevBuildingLevel(template) {
  const cap = template.maxLevel ?? DEV_TEST_BUILDING_LEVEL;
  return Math.min(DEV_TEST_BUILDING_LEVEL, cap);
}

function boostBuildings(cityBuildings = []) {
  return createStarterBuildings().map((template) => {
    const prev = cityBuildings.find((b) => b.id === template.id);
    const level = resolveDevBuildingLevel(template);
    return {
      ...(prev ?? template),
      ...template,
      level,
      built: true,
      locked: false,
      upgrading: false,
      producing: false,
    };
  });
}

function boostResearches(researches = []) {
  const byId = Object.fromEntries((researches ?? []).map((r) => [r.id, r]));
  return createStarterResearches().map((template) => {
    const prev = byId[template.id];
    const max = template.max ?? DEV_TEST_RESEARCH_LEVEL;
    const level = Math.min(DEV_TEST_RESEARCH_LEVEL, max);
    return {
      ...template,
      ...(prev ?? {}),
      level,
      active: false,
      queued: false,
      endsAt: null,
    };
  });
}

function buildDevIdleTroops(existing = []) {
  const prevById = Object.fromEntries((existing ?? []).map((t) => [t.id, t]));
  const seen = new Set();
  const rows = [];

  for (const def of ALL_COMBAT_UNIT_DEFS) {
    if (seen.has(def.id)) continue;
    seen.add(def.id);
    const prev = prevById[def.id];
    rows.push({
      id: def.id,
      name: prev?.name ?? getUnitDisplayName(def.id, def.name),
      icon: prev?.icon ?? def.image ?? '🎖️',
      available: DEV_TEST_UNIT_QTY,
      ...prev,
      available: DEV_TEST_UNIT_QTY,
    });
  }

  for (const prev of existing ?? []) {
    if (!seen.has(prev.id)) {
      rows.push({ ...prev, available: DEV_TEST_UNIT_QTY });
    }
  }

  return rows;
}

function boostResources(resources) {
  const rows = ensureCityResources(resources);
  return rows.map((row) => {
    if (row.id === 'energy') {
      return { ...row, current: DEV_TEST_RESOURCE_FILL, max: null };
    }
    const meta = RESOURCE_CATALOG[row.id];
    const starterMax = meta?.starter?.max;
    const cap = row.max == null
      ? DEV_TEST_RESOURCE_FILL
      : Math.max(starterMax ?? 0, row.max, DEV_TEST_RESOURCE_FILL);
    return { ...row, current: cap, max: cap };
  });
}

function boostCity(city) {
  if (!city) return city;
  return {
    ...city,
    buildings: boostBuildings(city.buildings),
    resources: boostResources(city.resources),
    idleTroops: buildDevIdleTroops(city.idleTroops),
    idleSpies: DEV_TEST_SPY_QTY,
    idleAgents: DEV_TEST_AGENT_QTY,
    constructionQueue: [],
    productionQueue: [],
  };
}

/**
 * Oyuncu state'ini solo-test için yükseltir (Supabase / yerel init sonrası).
 */
export function applyDevTestModeToState(state) {
  if (!isDevTestMode() || !state) return state;

  const cities = {};
  for (const [cityId, city] of Object.entries(state.cities ?? {})) {
    cities[cityId] = boostCity(city);
  }

  return {
    ...state,
    cities,
    researches: boostResearches(state.researches),
    protectionEndsAt: null,
    devTestModeActive: true,
    milAiCompleted: [...MIL_AI_TUTORIAL_QUEST_IDS],
    milAiScoutLaunched: true,
    milAiCelebration: null,
  };
}

/** Siber modal — tüm yetenekler açık */
export function getDevTestCyberCapabilities() {
  return CYBER_ABILITIES.map((a) => ({
    id: a.id,
    name: a.name,
    minLevel: 0,
  }));
}

export function stateLooksLikeDevTestBoost(state) {
  const cities = Object.values(state?.cities ?? {});
  if (!cities.length) return false;
  return cities.some((city) => {
    const buildings = city.buildings ?? [];
    const highLevel = buildings.filter((b) => (b.level ?? 0) >= DEV_TEST_BUILDING_LEVEL).length;
    const resources = city.resources ?? [];
    const filled = resources.filter(
      (r) => (r.current ?? 0) >= DEV_TEST_RESOURCE_FILL * 0.95
        && (r.max ?? 0) >= DEV_TEST_RESOURCE_FILL * 0.95,
    ).length;
    return highLevel >= 6 && filled >= 4;
  });
}

/** Admin kapalıyken DB'den gelen kazara boost'u starter seviyeye indirir. */
export function stripAccidentalDevBoost(state) {
  if (!state || isDevAdminLocalEnabled()) return state;
  if (!stateLooksLikeDevTestBoost(state)) return state;

  const cities = {};
  for (const [cityId, city] of Object.entries(state.cities ?? {})) {
    const reset = createCityState({
      buildings: createStarterBuildings(),
      resources: getStarterResources(),
      idleTroops: city.idleTroops?.map((t) => ({ ...t, available: t.available ?? 0 })),
      idleSpies: city.idleSpies ?? 0,
      idleAgents: city.idleAgents ?? 0,
      happiness: city.happiness ?? 72,
      taxRate: city.taxRate ?? 15,
      idlePopulation: city.idlePopulation,
      constructionQueue: city.constructionQueue ?? [],
      productionQueue: city.productionQueue ?? [],
    });
    cities[cityId] = {
      ...city,
      ...reset,
      buildings: reset.buildings,
      resources: reset.resources,
      idleTroops: reset.idleTroops,
      idleSpies: reset.idleSpies ?? 0,
      idleAgents: reset.idleAgents ?? 0,
    };
  }

  return {
    ...state,
    cities,
    researches: createStarterResearches().map((r) => ({ ...r })),
    devTestModeActive: false,
  };
}

export function getDevTestModeBannerText() {
  const viaAdmin = isDevAdminLocalEnabled();
  const prefix = viaAdmin ? '[ ADMİN TEST MODU ]' : '[ GELİŞTİRİCİ TEST ]';
  return `${prefix} Sv.${DEV_TEST_BUILDING_LEVEL} bina & araştırma · ${DEV_TEST_UNIT_QTY} birlik · kaynak doldurma · savaş/diplomasi bypass`;
}
