import { mapCities } from '../data/placeholder';
import { landUnits, airUnits, seaUnits } from '../data/placeholder';
import { enrichCityModel } from './cityModel';
import { normalizeIdeology } from './ideologySystem';
import { loadPlayerIdeology, loadProtectionEndsAt } from './briefingStorage';
import { computeCityHappiness } from './happinessSystem';
import { rehydrateCrisisCityEffects } from './crisisEngine';
import { createStarterBuildings, createStarterResearches, getStarterIdleTroops, getStarterResources } from '../lib/buildingUtils';
import { pruneCyberEffects, pruneKbrnEffects } from './happinessSystem';
import { applyProductionFreeze } from '../lib/resourceProduction';
import { ratePerSecond } from '../lib/gameUtils';
import { getVipProductionMultiplier } from '../lib/vipPrestige';
import { syncMapCitiesForPlayer } from '../map/mapOwnership';
import { isSupabaseConfigured, supabase } from './supabase';

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
  if (mode === 'attack' || mode === 'spy' || mode === 'found' || mode === 'trade' || mode === 'return') {
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
  return createStarterBuildings().map((b) => {
    const level = levelById[b.id] ?? b.level ?? 0;
    return {
      ...b,
      level,
      built: level > 0,
      upgrading: false,
      locked: b.locked && level < 1,
    };
  });
}

function mergeResources(dbRows, buildings, cityCtx, vipMult) {
  const byId = Object.fromEntries((dbRows ?? []).map((r) => [r.resource_id, r]));
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
  return createStarterResearches().map((template) => {
    const row = byId[template.id];
    if (!row) return { ...template };
    return {
      ...template,
      level: row.level ?? 0,
      max: row.max_level ?? template.max,
      active: row.is_active ?? false,
      queued: row.is_queued ?? false,
      endsAt: fromIso(row.ends_at),
    };
  });
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
  return {
    ...payload,
    id: row.id,
    filterType: payload.filterType ?? row.filter_type,
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

  const nowIso = toIso(state.now ?? Date.now());

  if (options.saveAllCities && state.cities) {
    const rows = Object.entries(state.cities).map(([id, city]) => ({
      profile_id: profileId,
      id,
      city_name: state.playerCities?.find((c) => c.id === id)?.name ?? id,
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
    for (const [id, city] of Object.entries(state.cities)) {
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
    };
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
        ideology: state.playerIdeology ?? null,
        protection_ends_at: state.protectionEndsAt ?? null,
        loyalty_score: Math.max(0, Math.floor(state.loyaltyScore ?? 0)),
        updated_at: nowIso,
      }).eq('id', profileId),
    ];
    if (options.researches && state.researches?.length) {
      const researchRows = state.researches.map((r) => ({
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
    return error ? { ok: false, error } : { ok: true };
  }

  const cityId = options.cityId ?? state.activeCityId;
  const city = state.cities?.[cityId];
  if (!city) return { ok: false, error: 'city_missing' };

  const cityRow = {
    profile_id: profileId,
    id: cityId,
    city_name: state.playerCities?.find((c) => c.id === cityId)?.name ?? cityId,
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
    };
    tasks.push(
      supabase.from('profiles').update({
        active_city_id: state.activeCityId,
        player_meta: meta,
        ideology: state.playerIdeology ?? null,
        protection_ends_at: state.protectionEndsAt ?? null,
        loyalty_score: Math.max(0, Math.floor(state.loyaltyScore ?? 0)),
        updated_at: nowIso,
      }).eq('id', profileId),
    );
  }

  if (options.researches && state.researches?.length) {
    const researchRows = state.researches.map((r) => ({
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

  if (options.expeditionIdsToComplete?.length) {
    tasks.push(
      supabase.from('expeditions').update({
        status: 'completed',
        completed_at: nowIso,
      }).in('id', options.expeditionIdsToComplete).eq('profile_id', profileId),
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

/**
 * Giriş sonrası tam oyun durumunu Supabase'den yükler.
 */
export async function loadGameState(userId, { playerName } = {}) {
  if (!isSyncEnabled() || !userId) return null;

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

  const [resRes, bldRes, unitRes, researchRes, expRes, reportRes] = await Promise.all([
    supabase.from('city_resources').select('*').eq('profile_id', userId).in('city_id', cityIds),
    supabase.from('city_buildings').select('*').eq('profile_id', userId).in('city_id', cityIds),
    supabase.from('city_units').select('*').eq('profile_id', userId).in('city_id', cityIds),
    supabase.from('player_researches').select('*').eq('profile_id', userId),
    supabase.from('expeditions').select('*').eq('profile_id', userId).eq('status', 'active'),
    supabase.from('game_reports').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(80),
  ]);

  const resourcesByCity = groupBy(cityIds, resRes.data ?? [], 'city_id');
  const buildingsByCity = groupBy(cityIds, bldRes.data ?? [], 'city_id');
  const unitsByCity = groupBy(cityIds, unitRes.data ?? [], 'city_id');

  const displayName = profile.display_name ?? playerName ?? 'Oyuncu';
  const playerIdeology = normalizeIdeology(profile.ideology)
    ?? loadPlayerIdeology(displayName);
  const protectionEndsAt = profile.protection_ends_at
    ?? loadProtectionEndsAt(displayName);
  const vipMult = getVipProductionMultiplier(profile.player_meta?.vipTier ?? 0);
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
  const reports = (reportRes.data ?? []).map(dbRowToReport);

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

  const playerMeta = profile.player_meta ?? {};
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
    activeCityId,
    playerIdeology,
    protectionEndsAt,
    loyaltyScore: profile.loyalty_score ?? 0,
    playerMeta,
    globalCbrnOutbreak: playerMeta.globalCbrnOutbreak ?? null,
    activeCrisis: playerMeta.activeCrisis ?? null,
    newsLog: Array.isArray(playerMeta.newsLog) ? playerMeta.newsLog : [],
    lastCbrnEventAt: playerMeta.lastCbrnEventAt ?? 0,
    lastCrisisEventAt: playerMeta.lastCrisisEventAt ?? 0,
    playerCities,
    cities,
    researches,
    expeditions,
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
  const localIds = new Set(state.expeditions.map((e) => e.id));
  const merged = [...state.expeditions];

  for (const exp of dbActive) {
    if (!localIds.has(exp.id)) merged.push(exp);
  }

  if (merged.length !== state.expeditions.length) {
    setState({ expeditions: merged });
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
      expeditionIdsToComplete: [exp.id],
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
  if (!userId || !setState) return false;

  lastSyncUserId = userId;
  const patch = await loadGameState(userId, { playerName });
  if (!patch) return false;

  setState(patch);
  if (typeof getState().tick === 'function') getState().tick();

  await syncExpeditionsFromServer(getState, setState, completeExpedition);

  scheduleSaveGameState(getState(), { profileId: userId, saveAllUnits: true, researches: true });
  return true;
}

export function getLastSyncUserId() {
  return lastSyncUserId;
}
