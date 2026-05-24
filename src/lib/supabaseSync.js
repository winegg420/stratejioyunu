import { mapCities } from '../data/placeholder';
import { landUnits, airUnits, seaUnits } from '../data/placeholder';
import { enrichCityModel } from './cityModel';
import { normalizeIdeology } from './ideologySystem';
import { loadPlayerIdeology, loadProtectionEndsAt } from './briefingStorage';
import { computeCityHappiness } from './happinessSystem';
import { rehydrateCrisisCityEffects } from './crisisEngine';
import { loadCachedReports, saveCachedReports } from './reportsCache';
import { recoverReportsFromHistory } from './reportRecovery';
import { createStarterBuildings, syncCityBuildingsToCatalog, getStarterIdleTroops, getStarterResources } from '../lib/buildingUtils';
import { mergeResearchProgress } from '../data/researchCatalog';
import { resolveResourceId } from '../data/resourceCatalog';
import { pruneCyberEffects, pruneKbrnEffects } from './happinessSystem';
import { applyProductionFreeze } from '../lib/resourceProduction';
import { ratePerSecond } from '../lib/gameUtils';
import { getVipProductionMultiplier } from '../lib/vipPrestige';
import { syncMapCitiesForPlayer } from '../map/mapOwnership';
import {
  loadCosmeticTitles,
  loadDailyQuestsState,
  loadSeasonEngagement,
  loadSeasonStats,
  loadWatchlist,
} from './engagementStorage';
import { createDefaultSeasonStats, syncSeasonEngagement } from './seasonChampionship';
import { syncDailyQuestsState } from './dailyQuests';
import { createDefaultChronicleState, normalizeDiplomaticTreaties, syncSeasonChronicles } from './historyBook';
import {
  loadDiplomaticTreaties,
  loadSeasonChronicles,
  loadTreatyBreaks,
} from './historyBookStorage';
import { isSupabaseConfigured, supabase } from './supabase';
import { getAuthUser } from './auth';
import { resolvePlayerDisplayName } from './profileApi';

/** Kayıt sonrası eski `metal` satırlarını temizler (enum hâlâ metal içeriyorsa). */
async function purgeLegacyMetalResourceRows(profileId, cityIds) {
  if (!supabase || !profileId || !cityIds?.length) return;
  const { error } = await supabase
    .from('city_resources')
    .delete()
    .eq('profile_id', profileId)
    .in('city_id', cityIds)
    .eq('resource_id', 'metal');
  if (error && !error.message?.includes('invalid input value')) {
    console.warn('[sync] legacy metal purge:', error.message);
  }
}
import { applyDevTestModeToState, isDevAdminLocalEnabled, stripAccidentalDevBoost } from './devTestMode';
import { resolveStateForCloudSave } from './adminModeControl';
import { applyAdminRestorableSlice, loadAdminSnapshot } from './adminModeSnapshot';

const LAND_UNIT_IDS = new Set(landUnits.map((u) => u.id));
const AIR_UNIT_IDS = new Set(airUnits.map((u) => u.id));
const SEA_UNIT_IDS = new Set(seaUnits.map((u) => u.id));

const SYNC_POLL_MS = 45_000;
let saveDebounceTimer = null;
let syncPollTimer = null;
let lastSyncUserId = null;

export function isSyncEnabled() {
  return isSupabaseConfigured && Boolean(supabase);
}

export async function getSyncUserId() {
  if (!isSyncEnabled()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('[supabaseSync] session error', error);
    return null;
  }
  return data.session?.user?.id ?? null;
}

function toIso(ms) {
  if (ms == null || Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function fromIso(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function unitDomain(unitId) {
  if (LAND_UNIT_IDS.has(unitId)) return 'land';
  if (AIR_UNIT_IDS.has(unitId)) return 'air';
  if (SEA_UNIT_IDS.has(unitId)) return 'sea';
  return 'land';
}

function reportFilterToEnum(filterType) {
  if (filterType === 'cyber' || filterType === 'kbrn') return 'spy';
  if (filterType === 'battle' || filterType === 'spy' || filterType === 'trade') return filterType;
  return 'battle';
}

function expeditionModeToEnum(mode) {
  if (mode === 'cyber' || mode === 'kbrn') return 'spy';
  if (mode === 'attack' || mode === 'spy' || mode === 'found' || mode === 'trade' || mode === 'cargo' || mode === 'return') {
    return mode;
  }
  return 'attack';
}

function applyOfflineResourceTick(city, lastTickMs, vipMult) {
  const now = Date.now();
  const last = lastTickMs ?? now;
  const elapsedSec = Math.min(Math.floor((now - last) / 1000), 60 * 60 * 8);
  if (elapsedSec <= 1) {
    return { resources: city.resources, lastTickAt: now };
  }

  let resources = city.resources.map((r) => {
    if (r.productionFrozen || (r.max != null && r.current > r.max)) return r;
    const inc = ratePerSecond(r.rate) * elapsedSec;
    if (!inc) return r;
    let next = r.current + inc;
    if (r.max != null) next = Math.min(r.max, next);
    return { ...r, current: Math.floor(next) };
  });

  resources = applyProductionFreeze(resources, city.buildings, city, vipMult);
  return { resources, lastTickAt: now };
}

function mergeBuildings(dbRows) {
  const levelById = Object.fromEntries((dbRows ?? []).map((r) => [r.building_id, r.level ?? 0]));
  const merged = createStarterBuildings().map((b) => {
    const level = levelById[b.id] ?? 0;
    return {
      ...b,
      level,
      built: level > 0,
      upgrading: false,
      locked: b.locked && level < 1,
    };
  });
  return syncCityBuildingsToCatalog(merged);
}

function mergeResources(dbRows, buildings, cityCtx, vipMult) {
  const byId = {};
  for (const row of dbRows ?? []) {
    const id = resolveResourceId(row.resource_id);
    const prev = byId[id];
    if (!prev) {
      byId[id] = { ...row, resource_id: id };
    } else {
      byId[id] = {
        ...prev,
        current_amount: Number(prev.current_amount ?? 0) + Number(row.current_amount ?? 0),
        max_amount: Math.max(Number(prev.max_amount ?? 0), Number(row.max_amount ?? 0)),
      };
    }
  }
  let resources = getStarterResources().map((template) => {
    const row = byId[template.id];
    return {
      ...template,
      current: Number(row?.current_amount ?? template.current),
      max: row?.max_amount != null ? Number(row.max_amount) : template.max,
      rate: row?.rate_display ?? template.rate,
    };
  });
  resources = applyProductionFreeze(resources, buildings, cityCtx, vipMult);
  return resources;
}

function mergeIdleTroops(dbRows) {
  const qtyById = Object.fromEntries((dbRows ?? []).map((r) => [r.unit_id, r.quantity ?? 0]));
  return getStarterIdleTroops().map((t) => ({
    ...t,
    available: qtyById[t.id] ?? 0,
  }));
}

function mergeResearches(dbRows) {
  const byId = Object.fromEntries((dbRows ?? []).map((r) => [r.research_id, r]));
  if (byId.kbrn_chem && !byId.kbrn_weapon) {
    byId.kbrn_weapon = { ...byId.kbrn_chem, research_id: 'kbrn_weapon' };
  }
  const savedById = {};
  for (const [id, row] of Object.entries(byId)) {
    savedById[id] = {
      level: row.level ?? 0,
      max_level: row.max_level,
      is_active: row.is_active,
      is_queued: row.is_queued,
      ends_at: fromIso(row.ends_at),
    };
  }
  return mergeResearchProgress(savedById);
}

function formatPastExpeditionDate(completedAtIso, lang = 'tr') {
  if (!completedAtIso) return '—';
  const d = new Date(completedAtIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dbRowToPastExpedition(row, lang = 'tr') {
  const result = row.result ?? {};
  const completedAt = fromIso(row.completed_at);
  const loot = result.loot ?? result.lootSummary ?? result.ganimet;
  const outcome = result.outcome
    ?? result.result
    ?? (result.attackerWon === true ? 'Zafer' : result.attackerWon === false ? 'Yenilgi' : null)
    ?? row.expedition_type
    ?? 'Tamamlandı';

  return {
    id: row.id,
    target: row.target_city_name ?? '—',
    result: outcome,
    loot: typeof loot === 'string' ? loot : '—',
    date: result.date ?? formatPastExpeditionDate(row.completed_at, lang),
    completedAt,
    type: row.expedition_type,
    mode: row.mode,
  };
}

function mergePastExpeditionLists(localList = [], remoteList = []) {
  const byId = new Map();
  for (const entry of remoteList ?? []) {
    if (entry?.id) byId.set(entry.id, entry);
  }
  for (const entry of localList ?? []) {
    if (!entry?.id) continue;
    const prev = byId.get(entry.id);
    byId.set(entry.id, prev ? { ...prev, ...entry } : entry);
  }
  return [...byId.values()].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
}

const EXPEDITION_STASH_PREFIX = 'strateji_exp_stash_';

function expeditionStashKey(userId) {
  return `${EXPEDITION_STASH_PREFIX}${userId}`;
}

/** Aktif seferleri yenileme öncesi sessionStorage'a yazar. */
export function stashActiveExpeditionsForRecovery(userId, expeditions = []) {
  if (!userId || !expeditions?.length) return;
  try {
    const active = expeditions.filter((e) => e?.id && !e.recalled);
    if (!active.length) return;
    sessionStorage.setItem(
      expeditionStashKey(userId),
      JSON.stringify({ savedAt: Date.now(), expeditions: active }),
    );
  } catch (err) {
    console.warn('[supabaseSync] expedition stash', err);
  }
}

export function readStashedExpeditions(userId) {
  if (!userId) return [];
  try {
    const raw = sessionStorage.getItem(expeditionStashKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.expeditions) ? parsed.expeditions : [];
  } catch {
    return [];
  }
}

export function clearStashedExpeditions(userId) {
  if (!userId) return;
  try {
    sessionStorage.removeItem(expeditionStashKey(userId));
  } catch {
    /* ignore */
  }
}

/** Yerel + sunucu aktif seferlerini birleştirir (uzun süre öncelikli). */
export function mergeActiveExpeditionLists(local = [], remote = []) {
  const byId = new Map();
  for (const exp of remote ?? []) {
    if (exp?.id) byId.set(exp.id, exp);
  }
  for (const exp of local ?? []) {
    if (!exp?.id) continue;
    const prev = byId.get(exp.id);
    if (!prev) {
      byId.set(exp.id, exp);
      continue;
    }
    const endsLocal = exp.endsAt ?? 0;
    const endsRemote = prev.endsAt ?? 0;
    const winner = endsLocal >= endsRemote ? { ...prev, ...exp } : { ...exp, ...prev };
    byId.set(exp.id, winner);
  }
  return [...byId.values()];
}

/** Sekme kapanırken / gizlenirken seferleri kaydet. */
export function flushExpeditionsBeforeHide(state) {
  if (!isSyncEnabled() || !state?._supabaseHydrated) return;
  const userId = lastSyncUserId;
  const list = state.expeditions ?? [];
  if (!userId || !list.length) return;
  stashActiveExpeditionsForRecovery(userId, list);
  saveGameStateNow(state, { profileId: userId, syncAllExpeditions: true }).catch((err) => {
    console.warn('[supabaseSync] flush expeditions', err);
  });
}

export function registerExpeditionPersistenceGuards(getState) {
  if (!isSyncEnabled() || typeof getState !== 'function') return () => {};

  const onHide = () => {
    if (document.visibilityState !== 'hidden') return;
    flushExpeditionsBeforeHide(getState());
  };

  const onPageHide = () => flushExpeditionsBeforeHide(getState());

  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onPageHide);
  return () => {
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', onPageHide);
  };
}

function dbRowToExpedition(row) {
  const payload = row.troop_payload ?? {};
  const mode = payload?.kbrn ? 'kbrn' : payload?.cyberVirus ? 'cyber' : row.mode;
  return {
    id: row.id,
    originCityId: row.origin_city_id,
    originCityName: row.origin_city_name ?? row.origin_city_id,
    target: row.target_city_name,
    targetCityId: row.target_city_id ?? undefined,
    sourceMapCityName: row.source_map_city_name ?? undefined,
    targetLat: row.target_lat,
    targetLng: row.target_lng,
    mode,
    type: row.expedition_type,
    direction: row.direction,
    troops: row.troops_summary,
    troopPayload: row.troop_payload ?? {},
    tradePayload: row.trade_payload ?? undefined,
    units: row.unit_count ?? 0,
    distance: row.distance_label,
    airRush: row.air_rush ?? false,
    durationSeconds: row.duration_seconds,
    startedAt: fromIso(row.started_at),
    endsAt: fromIso(row.ends_at),
  };
}

function expeditionToDbRow(exp, profileId) {
  return {
    id: exp.id,
    profile_id: profileId,
    origin_city_id: exp.originCityId,
    origin_city_name: exp.originCityName ?? null,
    target_city_name: exp.target,
    source_map_city_name: exp.sourceMapCityName ?? null,
    target_lat: exp.targetLat ?? null,
    target_lng: exp.targetLng ?? null,
    mode: expeditionModeToEnum(exp.mode ?? 'attack'),
    expedition_type: exp.type,
    direction: exp.direction ?? 'outgoing',
    status: 'active',
    troop_payload: exp.troopPayload ?? {},
    trade_payload: exp.tradePayload ?? null,
    troops_summary: exp.troops ?? null,
    unit_count: exp.units ?? 0,
    distance_label: exp.distance ?? null,
    air_rush: exp.airRush ?? false,
    started_at: toIso(exp.startedAt ?? Date.now()),
    ends_at: toIso(exp.endsAt),
    duration_seconds: exp.durationSeconds ?? Math.max(1, Math.floor(((exp.endsAt ?? Date.now()) - (exp.startedAt ?? Date.now())) / 1000)),
  };
}

function dbRowToReport(row) {
  const payload = row.payload ?? {};
  const filterType = payload.filterType ?? row.filter_type ?? 'battle';
  return {
    ...payload,
    id: row.id,
    filterType,
    type: row.report_type,
    title: row.title,
    preview: row.preview ?? payload.preview,
    date: row.report_date ?? payload.date,
    originCityId: row.origin_city_id ?? payload.originCityId,
    targetCity: row.target_city_name ?? payload.targetCity,
    winner: row.winner ?? payload.winner,
    isNew: !row.is_read,
  };
}

function reportSortKey(report) {
  const raw = report?.date ?? '';
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Sunucu + yerel raporları birleştirir (sunucu kaydı öncelikli). */
export function mergeReportLists(local = [], remote = []) {
  if (!remote?.length) return [...(local ?? [])];
  const byId = new Map();
  for (const r of local ?? []) {
    if (r?.id) byId.set(r.id, r);
  }
  for (const r of remote) {
    if (r?.id) byId.set(r.id, r);
  }
  return [...byId.values()].sort((a, b) => reportSortKey(b) - reportSortKey(a));
}

function reportToDbRow(report, profileId) {
  const { id, filterType, type, title, preview, date, originCityId, targetCity, winner, isNew, ...rest } = report;
  return {
    id,
    profile_id: profileId,
    filter_type: reportFilterToEnum(filterType),
    report_type: type ?? 'Rapor',
    title: title ?? 'Rapor',
    preview: preview ?? null,
    report_date: date ?? null,
    origin_city_id: originCityId ?? null,
    target_city_name: targetCity ?? null,
    winner: winner ?? null,
    is_read: !isNew,
    payload: { ...rest, filterType, type, title, preview, date, originCityId, targetCity, winner },
  };
}

/**
 * Zustand durumunu Supabase'e yazar (debounce'lu veya anında).
 */
export async function saveGameState(state, options = {}) {
  if (!isSyncEnabled()) return { ok: false, skipped: true };

  const profileId = options.profileId ?? await getSyncUserId();
  if (!profileId) return { ok: false, skipped: true };

  const persisted = resolveStateForCloudSave(state);
  const nowIso = toIso(persisted.now ?? Date.now());

  if (options.saveAllCities && persisted.cities) {
    const rows = Object.entries(persisted.cities).map(([id, city]) => ({
      profile_id: profileId,
      id,
      city_name: persisted.playerCities?.find((c) => c.id === id)?.name ?? id,
      last_tick_at: nowIso,
      idle_spies: city.idleSpies ?? 0,
      idle_agents: city.idleAgents ?? 0,
      idle_population: city.idlePopulation ?? 0,
      population: Math.floor(city.population ?? city.idlePopulation ?? 0),
      happiness: city.happiness ?? 72,
      tax_rate: city.taxRate ?? 15,
      cyber_effects: city.cyberEffects ?? [],
      kbrn_effects: city.kbrnEffects ?? [],
      cbrn_quarantine: Boolean(city.quarantine),
      construction_queue: city.constructionQueue ?? [],
      production_queue: city.productionQueue ?? [],
      updated_at: nowIso,
    }));
    const resourceRows = [];
    const buildingRows = [];
    for (const [id, city] of Object.entries(persisted.cities)) {
      for (const r of city.resources ?? []) {
        resourceRows.push({
          profile_id: profileId,
          city_id: id,
          resource_id: r.id,
          current_amount: Math.floor(r.current ?? 0),
          max_amount: r.max != null ? Math.floor(r.max) : null,
          rate_display: r.rate ?? null,
        });
      }
      for (const b of city.buildings ?? []) {
        buildingRows.push({
          profile_id: profileId,
          city_id: id,
          building_id: b.id,
          level: b.level ?? 0,
          max_level: b.maxLevel ?? null,
          meta: {
            upgrading: b.upgrading ?? false,
            producing: b.producing ?? false,
            locked: b.locked ?? false,
            built: b.built ?? false,
          },
        });
      }
    }
    const meta = {
      ...(state.playerMeta ?? {}),
      globalCbrnOutbreak: state.globalCbrnOutbreak ?? null,
      activeCrisis: state.activeCrisis ?? null,
      newsLog: state.newsLog ?? [],
      lastCbrnEventAt: state.lastCbrnEventAt ?? 0,
      lastCrisisEventAt: state.lastCrisisEventAt ?? 0,
      dailyQuests: state.dailyQuests ?? null,
      dailyQuestFlags: state.dailyQuestFlags ?? {},
      watchlist: state.watchlist ?? [],
      seasonEngagement: state.seasonEngagement ?? null,
      seasonStats: state.seasonStats ?? null,
      cosmeticTitles: state.cosmeticTitles ?? [],
      intelFeed: state.intelFeed ?? [],
      seasonChronicles: state.seasonChronicles ?? null,
      diplomaticTreaties: state.diplomaticTreaties ?? [],
      treatyBreaks: state.treatyBreaks ?? [],
      allianceOperations: state.allianceOperations ?? [],
      ideologyChangeCooldownAt: state.ideologyChangeCooldownAt ?? null,
    };
    const cityIds = Object.keys(persisted.cities ?? {});
    const tasks = [
      supabase.from('cities').upsert(rows, { onConflict: 'profile_id,id' }),
      resourceRows.length
        ? supabase.from('city_resources').upsert(resourceRows, { onConflict: 'profile_id,city_id,resource_id' })
        : Promise.resolve({ error: null }),
      buildingRows.length
        ? supabase.from('city_buildings').upsert(buildingRows, { onConflict: 'profile_id,city_id,building_id' })
        : Promise.resolve({ error: null }),
      supabase.from('profiles').update({
        player_meta: meta,
        ideology: persisted.playerIdeology ?? null,
        protection_ends_at: persisted.protectionEndsAt ?? null,
        loyalty_score: Math.max(0, Math.floor(persisted.loyaltyScore ?? 0)),
        updated_at: nowIso,
      }).eq('id', profileId),
    ];
    if (options.researches && persisted.researches?.length) {
      const researchRows = persisted.researches.map((r) => ({
        profile_id: profileId,
        research_id: r.id,
        level: r.level ?? 0,
        max_level: r.max ?? 15,
        is_active: r.active ?? false,
        is_queued: r.queued ?? false,
        ends_at: toIso(r.endsAt),
      }));
      tasks.push(
        supabase.from('player_researches').upsert(researchRows, { onConflict: 'profile_id,research_id' }),
      );
    }
    const results = await Promise.all(tasks);
    const error = results.find((r) => r.error)?.error;
    if (!error) await purgeLegacyMetalResourceRows(profileId, cityIds);
    return error ? { ok: false, error } : { ok: true };
  }

  const cityId = options.cityId ?? persisted.activeCityId;
  const city = persisted.cities?.[cityId];
  if (!city) return { ok: false, error: 'city_missing' };

  const cityRow = {
    profile_id: profileId,
    id: cityId,
    city_name: persisted.playerCities?.find((c) => c.id === cityId)?.name ?? cityId,
    last_tick_at: nowIso,
    idle_spies: city.idleSpies ?? 0,
    idle_agents: city.idleAgents ?? 0,
    idle_population: city.idlePopulation ?? 0,
    population: Math.floor(city.population ?? city.idlePopulation ?? 0),
    happiness: city.happiness ?? 72,
    tax_rate: city.taxRate ?? 15,
    cyber_effects: city.cyberEffects ?? [],
    kbrn_effects: city.kbrnEffects ?? [],
    cbrn_quarantine: Boolean(city.quarantine),
    construction_queue: city.constructionQueue ?? [],
    production_queue: city.productionQueue ?? [],
    updated_at: nowIso,
  };

  const resourceRows = (city.resources ?? []).map((r) => ({
    profile_id: profileId,
    city_id: cityId,
    resource_id: r.id,
    current_amount: Math.floor(r.current ?? 0),
    max_amount: r.max != null ? Math.floor(r.max) : null,
    rate_display: r.rate ?? null,
  }));

  const buildingRows = (city.buildings ?? []).map((b) => ({
    profile_id: profileId,
    city_id: cityId,
    building_id: b.id,
    level: b.level ?? 0,
    max_level: b.maxLevel ?? null,
    meta: {
      upgrading: b.upgrading ?? false,
      producing: b.producing ?? false,
      locked: b.locked ?? false,
      built: b.built ?? false,
    },
  }));

  const unitRows = (city.idleTroops ?? [])
    .filter((t) => (t.available ?? 0) > 0 || options.saveAllUnits)
    .map((t) => ({
      profile_id: profileId,
      city_id: cityId,
      unit_id: t.id,
      domain: unitDomain(t.id),
      quantity: t.available ?? 0,
    }));

  const tasks = [
    supabase.from('cities').upsert(cityRow, { onConflict: 'profile_id,id' }),
    resourceRows.length
      ? supabase.from('city_resources').upsert(resourceRows, { onConflict: 'profile_id,city_id,resource_id' })
      : Promise.resolve({ error: null }),
    buildingRows.length
      ? supabase.from('city_buildings').upsert(buildingRows, { onConflict: 'profile_id,city_id,building_id' })
      : Promise.resolve({ error: null }),
    unitRows.length
      ? supabase.from('city_units').upsert(unitRows, { onConflict: 'profile_id,city_id,unit_id' })
      : Promise.resolve({ error: null }),
  ];

  if (options.activeCityId !== false || options.savePlayerMeta || options.saveProfile) {
    const meta = {
      ...(state.playerMeta ?? {}),
      globalCbrnOutbreak: state.globalCbrnOutbreak ?? state.playerMeta?.globalCbrnOutbreak ?? null,
      activeCrisis: state.activeCrisis ?? state.playerMeta?.activeCrisis ?? null,
      newsLog: state.newsLog ?? state.playerMeta?.newsLog ?? [],
      lastCbrnEventAt: state.lastCbrnEventAt ?? state.playerMeta?.lastCbrnEventAt ?? 0,
      lastCrisisEventAt: state.lastCrisisEventAt ?? state.playerMeta?.lastCrisisEventAt ?? 0,
      dailyQuests: state.dailyQuests ?? state.playerMeta?.dailyQuests ?? null,
      dailyQuestFlags: state.dailyQuestFlags ?? state.playerMeta?.dailyQuestFlags ?? {},
      watchlist: state.watchlist ?? state.playerMeta?.watchlist ?? [],
      seasonEngagement: state.seasonEngagement ?? state.playerMeta?.seasonEngagement ?? null,
      seasonStats: state.seasonStats ?? state.playerMeta?.seasonStats ?? null,
      cosmeticTitles: state.cosmeticTitles ?? state.playerMeta?.cosmeticTitles ?? [],
      intelFeed: state.intelFeed ?? state.playerMeta?.intelFeed ?? [],
      seasonChronicles: state.seasonChronicles ?? state.playerMeta?.seasonChronicles ?? null,
      diplomaticTreaties: state.diplomaticTreaties ?? state.playerMeta?.diplomaticTreaties ?? [],
      treatyBreaks: state.treatyBreaks ?? state.playerMeta?.treatyBreaks ?? [],
      allianceOperations: state.allianceOperations ?? state.playerMeta?.allianceOperations ?? [],
      ideologyChangeCooldownAt: state.ideologyChangeCooldownAt ?? state.playerMeta?.ideologyChangeCooldownAt ?? null,
    };
    tasks.push(
      supabase.from('profiles').update({
        active_city_id: persisted.activeCityId,
        player_meta: meta,
        ideology: persisted.playerIdeology ?? null,
        protection_ends_at: persisted.protectionEndsAt ?? null,
        loyalty_score: Math.max(0, Math.floor(persisted.loyaltyScore ?? 0)),
        updated_at: nowIso,
      }).eq('id', profileId),
    );
  }

  if (options.researches && persisted.researches?.length) {
    const researchRows = persisted.researches.map((r) => ({
      profile_id: profileId,
      research_id: r.id,
      level: r.level ?? 0,
      max_level: r.max ?? 15,
      is_active: r.active ?? false,
      is_queued: r.queued ?? false,
      ends_at: toIso(r.endsAt),
      meta: { name: r.name, cost: r.cost, time: r.time },
    }));
    tasks.push(
      supabase.from('player_researches').upsert(researchRows, { onConflict: 'profile_id,research_id' }),
    );
  }

  if (options.expedition) {
    tasks.push(
      supabase.from('expeditions').upsert(expeditionToDbRow(options.expedition, profileId), { onConflict: 'id' }),
    );
  }

  if (options.syncAllExpeditions && state.expeditions?.length) {
    const rows = state.expeditions.map((exp) => expeditionToDbRow(exp, profileId));
    tasks.push(
      supabase.from('expeditions').upsert(rows, { onConflict: 'id' }),
    );
  }

  const expeditionCompletions = options.expeditionCompletions?.length
    ? options.expeditionCompletions
    : (options.expeditionIdsToComplete ?? []).map((id) => ({ id, result: null }));

  for (const completion of expeditionCompletions) {
    if (!completion?.id) continue;
    const patch = {
      status: 'completed',
      completed_at: nowIso,
    };
    if (completion.result) patch.result = completion.result;
    tasks.push(
      supabase.from('expeditions').update(patch)
        .eq('id', completion.id)
        .eq('profile_id', profileId),
    );
  }

  if (options.reports?.length) {
    const reportRows = options.reports.map((r) => reportToDbRow(r, profileId));
    tasks.push(
      supabase.from('game_reports').upsert(reportRows, { onConflict: 'id' }),
    );
  }

  const results = await Promise.all(tasks);
  const error = results.find((r) => r.error)?.error;
  if (error) {
    console.warn('[supabaseSync] saveGameState failed', error);
    return { ok: false, error };
  }
  await purgeLegacyMetalResourceRows(profileId, [cityId]);
  return { ok: true };
}

export function scheduleSaveGameState(state, options = {}) {
  if (!isSyncEnabled()) return;
  if (options.immediate) {
    saveGameState(state, options).catch((err) => console.warn('[supabaseSync] immediate save', err));
    return;
  }
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveGameState(state, options).catch((err) => console.warn('[supabaseSync] debounced save', err));
  }, 280);
}

/** Bekleyen debounce iptal — anında kayıt (double-submit kilidi için). */
export function saveGameStateNow(state, options = {}) {
  if (!isSyncEnabled()) return Promise.resolve({ ok: true, skipped: true });
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  return saveGameState(state, options);
}

/**
 * Giriş sonrası tam oyun durumunu Supabase'den yükler.
 */
export async function loadGameState(userId, { playerName } = {}) {
  if (!isSyncEnabled() || !userId) return null;

  try {
  let { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.warn('[supabaseSync] profile load', profileErr);
    return null;
  }

  if (!profile) {
    await supabase.rpc('seed_starter_city', { p_profile_id: userId });
    const retry = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    profile = retry.data;
  }

  let { data: cityRows, error: citiesErr } = await supabase
    .from('cities')
    .select('*')
    .eq('profile_id', userId);

  if (citiesErr) {
    console.warn('[supabaseSync] cities load', citiesErr);
    return null;
  }

  if (!cityRows?.length) {
    await supabase.rpc('seed_starter_city', { p_profile_id: userId });
    const retry = await supabase.from('cities').select('*').eq('profile_id', userId);
    cityRows = retry.data ?? [];
  }

  if (!cityRows.length) return null;

  const cityIds = cityRows.map((c) => c.id);

  const [resRes, bldRes, unitRes, researchRes, expRes, pastExpRes, reportRes] = await Promise.all([
    supabase.from('city_resources').select('*').eq('profile_id', userId).in('city_id', cityIds),
    supabase.from('city_buildings').select('*').eq('profile_id', userId).in('city_id', cityIds),
    supabase.from('city_units').select('*').eq('profile_id', userId).in('city_id', cityIds),
    supabase.from('player_researches').select('*').eq('profile_id', userId),
    supabase.from('expeditions').select('*').eq('profile_id', userId).eq('status', 'active'),
    supabase.from('expeditions').select('*').eq('profile_id', userId).eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(60),
    supabase.from('game_reports').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(80),
  ]);

  if (reportRes.error) {
    console.warn('[supabaseSync] game_reports load', reportRes.error);
  }

  const resourcesByCity = groupBy(cityIds, resRes.data ?? [], 'city_id');
  const buildingsByCity = groupBy(cityIds, bldRes.data ?? [], 'city_id');
  const unitsByCity = groupBy(cityIds, unitRes.data ?? [], 'city_id');

  const authUser = await getAuthUser();
  const displayName = resolvePlayerDisplayName({
    profile,
    user: authUser,
    playerName,
  });
  const playerMeta = profile.player_meta ?? {};
  const isAdminUser = Boolean(
    playerMeta.isAdmin === true
    || playerMeta.role === 'admin',
  );
  const playerIdeology = normalizeIdeology(profile.ideology)
    ?? loadPlayerIdeology(displayName);
  const protectionEndsAt = profile.protection_ends_at
    ?? loadProtectionEndsAt(displayName);
  const vipMult = getVipProductionMultiplier(playerMeta.vipTier ?? 0);
  const activeCityId = profile.active_city_id ?? cityRows[0].id;

  const cities = {};
  const playerCities = [];

  for (const row of cityRows) {
    const buildings = mergeBuildings(buildingsByCity[row.id]);
    const baseCtx = {
      buildings,
      idlePopulation: row.idle_population ?? 0,
      idleTroops: mergeIdleTroops(unitsByCity[row.id]),
    };
    const { resources, lastTickAt } = applyOfflineResourceTick(
      {
        resources: mergeResources(resourcesByCity[row.id], buildings, baseCtx, vipMult),
        buildings,
      },
      fromIso(row.last_tick_at),
      vipMult,
    );

    cities[row.id] = enrichCityModel({
      resources,
      buildings,
      idleTroops: baseCtx.idleTroops,
      idleSpies: row.idle_spies ?? 0,
      idleAgents: row.idle_agents ?? 0,
      idlePopulation: row.idle_population ?? 0,
      population: row.population ?? row.idle_population ?? 2400,
      happiness: row.happiness ?? 72,
      taxRate: row.tax_rate ?? 15,
      cyberEffects: pruneCyberEffects(row.cyber_effects ?? []),
      kbrnEffects: pruneKbrnEffects(row.kbrn_effects ?? []),
      quarantine: row.cbrn_quarantine ?? false,
      constructionQueue: row.construction_queue ?? [],
      productionQueue: row.production_queue ?? [],
      lastTickAt,
    });

    playerCities.push({
      id: row.id,
      name: row.city_name,
      province: row.province_code ?? '',
      provinceName: row.province_name ?? row.city_name,
      type: row.city_type ?? 'Şehir',
      lat: row.lat,
      lng: row.lng,
    });
  }

  const researches = mergeResearches(researchRes.data);
  const expeditions = (expRes.data ?? []).map(dbRowToExpedition);
  const pastExpeditions = (pastExpRes.data ?? []).map((row) => dbRowToPastExpedition(row));
  const dbReports = (reportRes.error ? [] : (reportRes.data ?? [])).map(dbRowToReport);
  const reports = mergeReportLists(loadCachedReports(displayName), dbReports);
  saveCachedReports(reports, displayName);

  const activeCrisis = playerMeta.activeCrisis ?? null;
  const crisisPatches = rehydrateCrisisCityEffects(
    { cities, playerCities, mapCities: mapCities.map((c) => ({ ...c })), activeCrisis },
  );
  for (const [cityId, patch] of Object.entries(crisisPatches)) {
    if (cities[cityId]) cities[cityId] = { ...cities[cityId], ...patch };
  }

  for (const cityId of Object.keys(cities)) {
    const c = cities[cityId];
    const happiness = computeCityHappiness(c, {
      cityId,
      incomingAttacks: [],
      expeditions,
      activeCrisis,
    });
    cities[cityId] = { ...c, happiness };
  }

  let mapCitiesSynced = syncMapCitiesForPlayer(
    mapCities.map((c) => ({ ...c })),
    playerCities,
    displayName,
    playerIdeology,
  );

  const outbreak = playerMeta.globalCbrnOutbreak;
  if (outbreak?.active && outbreak.affectedCityNames?.length) {
    const affected = new Set(outbreak.affectedCityNames);
    mapCitiesSynced = mapCitiesSynced.map((mc) => (
      affected.has(mc.name)
        ? { ...mc, quarantine: true, cbrnOutbreak: outbreak.id }
        : mc
    ));
  }

  return {
    profileDisplayName: displayName,
    profilePlayerName: profile.player_name,
    isAdminUser,
    activeCityId,
    playerIdeology,
    protectionEndsAt,
    ideologyChangeCooldownAt: playerMeta.ideologyChangeCooldownAt ?? null,
    loyaltyScore: profile.loyalty_score ?? 0,
    playerMeta,
    globalCbrnOutbreak: playerMeta.globalCbrnOutbreak ?? null,
    activeCrisis: playerMeta.activeCrisis ?? null,
    newsLog: Array.isArray(playerMeta.newsLog) ? playerMeta.newsLog : [],
    lastCbrnEventAt: playerMeta.lastCbrnEventAt ?? 0,
    lastCrisisEventAt: playerMeta.lastCrisisEventAt ?? 0,
    seasonStats: playerMeta.seasonStats ?? loadSeasonStats(displayName) ?? createDefaultSeasonStats(),
    seasonEngagement: syncSeasonEngagement(
      playerMeta.seasonEngagement ?? loadSeasonEngagement(displayName),
    ),
    dailyQuests: syncDailyQuestsState(
      playerMeta.dailyQuests ?? loadDailyQuestsState(displayName),
      playerIdeology,
    ),
    dailyQuestFlags: playerMeta.dailyQuestFlags ?? {},
    watchlist: playerMeta.watchlist ?? loadWatchlist(displayName),
    intelFeed: playerMeta.intelFeed ?? [],
    cosmeticTitles: playerMeta.cosmeticTitles ?? loadCosmeticTitles(displayName),
    seasonChronicles: syncSeasonChronicles(
      playerMeta.seasonChronicles ?? loadSeasonChronicles(displayName) ?? createDefaultChronicleState(),
    ),
    diplomaticTreaties: normalizeDiplomaticTreaties(
      playerMeta.diplomaticTreaties ?? loadDiplomaticTreaties(displayName),
    ),
    treatyBreaks: playerMeta.treatyBreaks ?? loadTreatyBreaks(displayName),
    allianceOperations: Array.isArray(playerMeta.allianceOperations)
      ? playerMeta.allianceOperations
      : [],
    playerCities,
    cities,
    researches,
    expeditions,
    pastExpeditions,
    reports,
    mapCities: mapCitiesSynced,
    lastTickAt: Date.now(),
    now: Date.now(),
    navBadges: {
      expeditions: expeditions.length > 0,
      reports: reports.some((r) => r.isNew),
    },
    _supabaseHydrated: true,
  };
  } catch (err) {
    console.error('[supabaseSync] loadGameState failed', err);
    return null;
  }
}

function groupBy(cityIds, rows, key) {
  const map = Object.fromEntries(cityIds.map((id) => [id, []]));
  for (const row of rows) {
    if (map[row[key]]) map[row[key]].push(row);
  }
  return map;
}

/**
 * Süresi dolmuş seferleri işler; raporları DB'ye yazar.
 * Tarayıcı kapalıyken biten seferler bir sonraki açılış / poll'da tamamlanır.
 */
function isMissingTableError(error) {
  const code = error?.code ?? '';
  const msg = String(error?.message ?? '').toLowerCase();
  return code === '42P01' || code === 'PGRST205' || msg.includes('does not exist');
}

function rowToReportFromExpeditionTable(row) {
  const payload = row.payload ?? row.meta ?? row.result ?? {};
  const filterType = payload.filterType
    ?? (row.mode === 'spy' ? 'spy' : row.mode === 'cyber' || row.mode === 'kbrn' ? row.mode : 'battle');
  return {
    ...payload,
    id: row.id ?? payload.id ?? `exp-rpt-${row.expedition_id ?? row.created_at}`,
    filterType,
    type: row.report_type ?? row.expedition_type ?? payload.type ?? 'Sefer Raporu',
    title: row.title ?? payload.title ?? row.expedition_type ?? 'Sefer Raporu',
    preview: row.preview ?? payload.preview ?? row.target_city_name ?? '—',
    date: row.report_date ?? payload.date ?? row.completed_at ?? row.created_at,
    targetCity: row.target_city_name ?? payload.targetCity,
    isNew: row.is_read != null ? !row.is_read : (payload.isNew ?? false),
    reportCategory: payload.reportCategory ?? 'expedition',
  };
}

function rowToReportFromOperationTable(row) {
  const payload = row.payload ?? row.meta ?? row.result ?? {};
  return {
    ...payload,
    id: row.id ?? payload.id ?? `op-rpt-${row.created_at}`,
    filterType: payload.filterType ?? (row.operation_type === 'cyber' ? 'cyber' : row.operation_type === 'kbrn' ? 'kbrn' : 'spy'),
    type: row.report_type ?? row.operation_type ?? payload.type ?? 'Ajan Operasyonu',
    title: row.title ?? payload.title ?? 'Operasyon Raporu',
    preview: row.preview ?? payload.preview ?? '—',
    date: row.report_date ?? payload.date ?? row.completed_at ?? row.created_at,
    targetCity: row.target_city_name ?? payload.targetCity,
    isNew: row.is_read != null ? !row.is_read : (payload.isNew ?? false),
    reportCategory: 'operation',
  };
}

function completedExpeditionToReport(row) {
  const result = row.result ?? {};
  const mode = row.mode === 'spy' ? 'spy' : 'attack';
  return {
    id: `exp-done-${row.id}`,
    filterType: mode,
    type: row.expedition_type ?? 'Sefer',
    title: result.outcome ?? row.expedition_type ?? 'Sefer tamamlandı',
    preview: result.loot ?? result.preview ?? row.target_city_name ?? '—',
    date: result.date ?? row.completed_at,
    targetCity: row.target_city_name,
    winner: result.winner ?? payloadWinnerFromResult(result),
    isNew: false,
    reportCategory: 'expedition',
  };
}

function payloadWinnerFromResult(result) {
  if (result?.attackerWon === true) return 'attacker';
  if (result?.attackerWon === false) return 'defender';
  return result?.winner ?? null;
}

async function fetchOptionalReportTable(table, profileId) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(80);
  if (!error) return data ?? [];
  if (isMissingTableError(error)) return [];
  console.warn(`[supabaseSync] ${table}`, error);
  return [];
}

/** Supabase rapor tablolarından (game_reports + isteğe bağlı sefer/operasyon) yeniler. */
export async function refreshReportsFromServer(getState, setState) {
  if (!isSyncEnabled() || typeof getState !== 'function' || typeof setState !== 'function') {
    return { ok: false };
  }

  const profileId = await getSyncUserId();
  if (!profileId) return { ok: false };

  const [gameRows, expReportRows, opReportRows, completedExpRows] = await Promise.all([
    supabase
      .from('game_reports')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(80)
      .then((res) => {
        if (res.error) {
          console.warn('[supabaseSync] game_reports', res.error);
          return [];
        }
        return res.data ?? [];
      }),
    fetchOptionalReportTable('expedition_reports', profileId),
    fetchOptionalReportTable('operation_reports', profileId),
    supabase
      .from('expeditions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(40)
      .then((res) => (res.error ? [] : (res.data ?? []))),
  ]);

  const remote = [
    ...gameRows.map(dbRowToReport),
    ...expReportRows.map(rowToReportFromExpeditionTable),
    ...opReportRows.map(rowToReportFromOperationTable),
    ...completedExpRows.map(completedExpeditionToReport),
  ];

  const merged = recoverReportsFromHistory({
    reports: mergeReportLists(getState().reports, remote),
    pastExpeditions: getState().pastExpeditions,
  });
  saveCachedReports(merged, getState().playerMeta?.displayName ?? getState().playerName);
  const hasUnread = merged.some((r) => r.isNew);
  setState({
    reports: merged,
    navBadges: {
      ...getState().navBadges,
      reports: hasUnread,
    },
  });
  return { ok: true, count: merged.length };
}

function archiveRowToPastExpedition(row, lang = 'tr') {
  return dbRowToPastExpedition({
    id: row.id ?? row.expedition_id,
    target_city_name: row.target_city_name ?? row.target ?? row.target_name,
    expedition_type: row.expedition_type ?? row.type,
    completed_at: row.completed_at ?? row.ended_at ?? row.created_at,
    result: row.result ?? row.payload ?? row.outcome ?? {},
    mode: row.mode,
  }, lang);
}

async function fetchOptionalPastExpeditionTable(table, profileId) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('profile_id', profileId)
    .order('completed_at', { ascending: false })
    .limit(60);
  if (!error) return data ?? [];
  if (isMissingTableError(error)) return [];
  console.warn(`[supabaseSync] ${table}`, error);
  return [];
}

/** Tamamlanan casusluk sondaları — harita Cephe İstihbaratı paneli. */
export async function fetchSpyProbeReportsFromServer(profileId) {
  if (!isSyncEnabled() || !profileId) return [];

  const [reportRes, spyExpRes] = await Promise.all([
    supabase
      .from('game_reports')
      .select('*')
      .eq('profile_id', profileId)
      .eq('filter_type', 'spy')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('expeditions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('mode', 'spy')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(25),
  ]);

  const fromReports = (reportRes.error ? [] : (reportRes.data ?? [])).map(dbRowToReport);
  if (reportRes.error) {
    console.warn('[supabaseSync] spy game_reports', reportRes.error);
  }

  const fromExpeditions = (spyExpRes.error ? [] : (spyExpRes.data ?? [])).map((row) => {
    const result = row.result ?? {};
    return {
      id: row.id ?? `spy-exp-${row.completed_at}`,
      filterType: 'spy',
      mode: 'spy',
      type: 'Casusluk Sondası',
      title: `${row.target_city_name ?? 'Hedef'} — Casusluk Sondası`,
      preview: result.findings ?? result.outcome ?? result.preview ?? row.troops_summary ?? 'Tamamlandı',
      targetCity: row.target_city_name,
      date: result.date ?? formatPastExpeditionDate(row.completed_at),
      isNew: false,
    };
  });

  return mergeReportLists(fromReports, fromExpeditions);
}

export async function refreshPastExpeditionsFromServer(getState, setState) {
  if (!isSyncEnabled() || typeof getState !== 'function' || typeof setState !== 'function') {
    return { ok: false };
  }

  const profileId = await getSyncUserId();
  if (!profileId) return { ok: false };

  let remote = [];
  const archiveRows = await fetchOptionalPastExpeditionTable('completed_expeditions', profileId);
  if (archiveRows.length > 0) {
    remote = archiveRows.map((row) => archiveRowToPastExpedition(row));
  } else {
    const { data, error } = await supabase
      .from('expeditions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('[supabaseSync] past expeditions', error);
      return { ok: false, error };
    }
    remote = (data ?? []).map((row) => dbRowToPastExpedition(row));
  }

  const merged = mergePastExpeditionLists(getState().pastExpeditions, remote);
  setState({ pastExpeditions: merged });
  return { ok: true, count: merged.length };
}

export async function syncExpeditionsFromServer(getState, setState, completeExpedition) {
  if (!isSyncEnabled() || typeof completeExpedition !== 'function') {
    return { completed: 0 };
  }

  const profileId = await getSyncUserId();
  if (!profileId) return { completed: 0 };

  const nowIso = new Date().toISOString();

  const { data: overdueRows, error } = await supabase
    .from('expeditions')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .lte('ends_at', nowIso);

  if (error) {
    console.warn('[supabaseSync] overdue expeditions', error);
    return { completed: 0, error };
  }

  const { data: activeRows } = await supabase
    .from('expeditions')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  let state = getState();
  const dbActive = (activeRows ?? []).map(dbRowToExpedition);
  const byId = new Map((state.expeditions ?? []).map((exp) => [exp.id, exp]));
  for (const exp of dbActive) {
    if (!byId.has(exp.id)) {
      byId.set(exp.id, exp);
      continue;
    }
    const local = byId.get(exp.id);
    if ((local.endsAt ?? 0) < (exp.endsAt ?? 0)) {
      byId.set(exp.id, { ...local, ...exp });
    }
  }
  const merged = [...byId.values()];
  const changed = merged.length !== (state.expeditions?.length ?? 0)
    || merged.some((exp, i) => exp.id !== state.expeditions[i]?.id);

  if (changed) {
    setState({
      expeditions: merged,
      mapRouteSyncRev: (state.mapRouteSyncRev ?? 0) + 1,
    });
    state = getState();
  }

  const overdueIds = new Set((overdueRows ?? []).map((r) => r.id));
  const toComplete = state.expeditions.filter(
    (e) => overdueIds.has(e.id) || (e.endsAt != null && e.endsAt <= Date.now()),
  );

  const completedIds = [];
  for (const exp of toComplete) {
    if (!getState().expeditions.some((e) => e.id === exp.id)) continue;

    const beforeReports = getState().reports?.length ?? 0;
    completeExpedition(exp.id);
    completedIds.push(exp.id);

    const afterState = getState();
    const addedCount = Math.max(0, (afterState.reports?.length ?? 0) - beforeReports);
    const newReports = addedCount > 0 ? (afterState.reports ?? []).slice(0, addedCount) : [];

    await saveGameState(afterState, {
      profileId,
      cityId: exp.originCityId || afterState.activeCityId,
      immediate: true,
      expeditionCompletions: [{
        id: exp.id,
        result: {
          outcome: exp.type ?? 'Tamamlandı',
          loot: '—',
          date: formatPastExpeditionDate(new Date().toISOString()),
        },
      }],
      reports: newReports,
      saveAllUnits: true,
      syncAllExpeditions: true,
    });
  }

  return { completed: completedIds.length, ids: completedIds };
}

export function startSyncPolling(getState, setState, completeExpedition) {
  stopSyncPolling();
  if (!isSyncEnabled()) return;

  const run = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      await syncExpeditionsFromServer(getState, setState, completeExpedition);
      if (typeof getState().refreshServerBroadcast === 'function') {
        await getState().refreshServerBroadcast();
      }
    } catch (err) {
      console.warn('[supabaseSync] poll', err);
    }
  };

  run();
  syncPollTimer = setInterval(run, SYNC_POLL_MS);

  const onVisible = () => {
    if (document.visibilityState === 'visible') run();
  };
  document.addEventListener('visibilitychange', onVisible);
  startSyncPolling._onVisible = onVisible;
}

export function stopSyncPolling() {
  if (syncPollTimer) {
    clearInterval(syncPollTimer);
    syncPollTimer = null;
  }
  if (startSyncPolling._onVisible) {
    document.removeEventListener('visibilitychange', startSyncPolling._onVisible);
    startSyncPolling._onVisible = null;
  }
}

export async function hydrateGameStore(userId, { playerName, getState, setState, completeExpedition }) {
  if (!userId || !setState) return { ok: false };

  lastSyncUserId = userId;
  const patch = await loadGameState(userId, { playerName });
  if (!patch) return { ok: false };

  const stashed = readStashedExpeditions(userId);

  setState((prev) => {
    const mergedExpeditions = mergeActiveExpeditionLists(
      mergeActiveExpeditionLists(prev.expeditions, stashed),
      patch.expeditions,
    );
    let merged = {
      ...prev,
      ...patch,
      expeditions: mergedExpeditions,
      pastExpeditions: mergePastExpeditionLists(prev.pastExpeditions, patch.pastExpeditions),
      reports: recoverReportsFromHistory({
        reports: mergeReportLists(
          mergeReportLists(loadCachedReports(playerName), prev.reports),
          patch.reports,
        ),
        pastExpeditions: mergePastExpeditionLists(prev.pastExpeditions, patch.pastExpeditions),
      }),
      navBadges: {
        ...prev.navBadges,
        ...patch.navBadges,
        expeditions: mergedExpeditions.length > 0,
      },
      devTestModeActive: false,
    };
    const snapshot = loadAdminSnapshot();
    if (snapshot && !isDevAdminLocalEnabled()) {
      merged = applyAdminRestorableSlice(merged, snapshot);
    } else if (!isDevAdminLocalEnabled()) {
      merged = stripAccidentalDevBoost(merged);
    }
    if (isDevAdminLocalEnabled()) {
      merged = applyDevTestModeToState({ ...merged, devTestModeActive: true });
    }
    return merged;
  });
  clearStashedExpeditions(userId);
  if (typeof getState().tick === 'function') getState().tick();

  await syncExpeditionsFromServer(getState, setState, completeExpedition);

  const afterSync = getState();
  scheduleSaveGameState(afterSync, {
    profileId: userId,
    saveAllUnits: true,
    researches: true,
    syncAllExpeditions: (afterSync.expeditions?.length ?? 0) > 0,
  });

  const state = getState();
  return {
    ok: true,
    displayName: state.profileDisplayName,
    playerName: state.profilePlayerName,
    isAdminUser: state.isAdminUser,
  };
}

export function getLastSyncUserId() {
  return lastSyncUserId;
}
