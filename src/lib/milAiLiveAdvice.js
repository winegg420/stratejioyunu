/**
 * MIL-AI — Supabase + yerel store ile dinamik tavsiye (5 dk yenileme).
 */
import { translate } from '../i18n';
import { supabase, isSupabaseConfigured } from './supabase';
import { filterActiveExpeditions } from './gameUtils';
import { getBuildingById, getHqLevel } from './buildingUtils';
import { getAiCenterLevel, isAiCenterOperational } from './aiCenterEngine';
import { milAiCommandLine } from './milAiDynamicAdvice';

export const MIL_AI_ADVICE_REFRESH_MS = 5 * 60 * 1000;

export async function fetchMilAiLiveContext(profileId) {
  if (!isSupabaseConfigured || !supabase || !profileId) return null;

  try {
    const [cityRes, expRes, reportRes] = await Promise.all([
      supabase
        .from('cities')
        .select('id, resources, buildings, happiness, tax_rate, cyber_effects, construction_queue, production_queue')
        .eq('profile_id', profileId),
      supabase
        .from('expeditions')
        .select('id, mode, status, ends_at, direction')
        .eq('profile_id', profileId)
        .eq('status', 'active'),
      supabase
        .from('game_reports')
        .select('id, is_read')
        .eq('profile_id', profileId),
    ]);

    if (cityRes.error) console.warn('[milAiLive] cities', cityRes.error);
    if (expRes.error) console.warn('[milAiLive] expeditions', expRes.error);
    if (reportRes.error) console.warn('[milAiLive] reports', reportRes.error);

    const cities = cityRes.data ?? [];
    const activeCity = cities[0] ?? null;
    const resources = activeCity?.resources ?? [];
    const now = Date.now();

    const activeExpeditions = (expRes.data ?? []).filter((row) => {
      if (row.status === 'completed') return false;
      if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false;
      return true;
    });

    let constructionQueued = 0;
    let productionQueued = 0;
    for (const c of cities) {
      constructionQueued += (c.construction_queue ?? []).length;
      productionQueued += (c.production_queue ?? []).length;
    }

    const unreadReports = (reportRes.data ?? []).filter((r) => !r.is_read).length;

    return {
      fetchedAt: now,
      resources,
      happiness: activeCity?.happiness ?? null,
      taxRate: activeCity?.tax_rate ?? null,
      hqLevel: getHqLevel({ buildings: activeCity?.buildings ?? [] }),
      aiLevel: getBuildingById(activeCity, 'ai_center')?.level ?? 0,
      activeExpeditions: activeExpeditions.length,
      cyberOps: activeExpeditions.filter((e) => e.mode === 'cyber').length,
      spyOps: activeExpeditions.filter((e) => e.mode === 'spy').length,
      attackOps: activeExpeditions.filter((e) => e.mode === 'attack').length,
      constructionQueued,
      productionQueued,
      unreadReports,
      cyberEffects: (activeCity?.cyber_effects ?? []).filter(
        (fx) => !fx.endsAt || fx.endsAt > now,
      ).length,
    };
  } catch (err) {
    console.warn('[milAiLive] fetch failed', err);
    return null;
  }
}

function getActiveCity(state) {
  return state?.cities?.[state.activeCityId] ?? null;
}

function mergeLiveSnapshot(state, remote) {
  const city = getActiveCity(state);
  const resources = city?.resources ?? remote?.resources ?? [];
  const expeditions = state?.expeditions ?? [];
  const now = state?.now ?? Date.now();
  const active = filterActiveExpeditions(expeditions, now);
  const intel = (state?.intelOperations ?? []).filter((op) => {
    if (op.endsAt != null && op.endsAt <= now) return false;
    return op.status !== 'completed' && op.status !== 'done';
  });

  return {
    resources,
    happiness: city?.happiness ?? remote?.happiness,
    taxRate: city?.taxRate ?? remote?.taxRate,
    hqLevel: getHqLevel(city),
    aiLevel: getAiCenterLevel(city),
    activeExpeditions: remote?.activeExpeditions ?? active.length,
    cyberOps: active.filter((e) => e.mode === 'cyber').length || remote?.cyberOps || 0,
    spyOps: active.filter((e) => e.mode === 'spy').length || remote?.spyOps || 0,
    attackOps: active.filter((e) => e.mode === 'attack').length || remote?.attackOps || 0,
    intelOps: intel.length,
    constructionQueued: remote?.constructionQueued
      ?? (city?.constructionQueue?.length ?? 0),
    productionQueued: remote?.productionQueued
      ?? (city?.productionQueue?.length ?? 0),
    unreadReports: remote?.unreadReports
      ?? (state?.reports ?? []).filter((r) => r.isNew).length,
    cyberDefense: (city?.cyberEffects ?? []).filter((fx) => !fx.endsAt || fx.endsAt > now).length
      || remote?.cyberEffects
      || 0,
  };
}

/**
 * Gerçek oyun verisine göre tavsiye satırı — 5 dk bucket ile döner.
 */
export function pickMilAiLiveAdvice(state, remote, lang = 'tr') {
  const city = getActiveCity(state);
  if (!isAiCenterOperational(city)) return null;

  const snap = mergeLiveSnapshot(state, remote);
  const now = state?.now ?? Date.now();
  const bucket = Math.floor(now / MIL_AI_ADVICE_REFRESH_MS);
  const candidates = [];

  const fuel = snap.resources.find((r) => r.id === 'fuel');
  const energy = snap.resources.find((r) => r.id === 'energy');
  const hammadde = snap.resources.find((r) => r.id === 'hammadde');

  if (snap.cyberOps > 0) {
    candidates.push(translate(lang, 'milAi.advice.live.cyberOutbound', { count: snap.cyberOps }));
  }
  if (snap.spyOps > 0 || snap.intelOps > 0) {
    candidates.push(translate(lang, 'milAi.advice.live.intelActive', {
      count: snap.spyOps + snap.intelOps,
    }));
  }
  if (snap.attackOps > 0) {
    candidates.push(translate(lang, 'milAi.advice.live.attackOutbound', { count: snap.attackOps }));
  }
  if (snap.activeExpeditions > 0 && !snap.cyberOps && !snap.spyOps && !snap.attackOps) {
    candidates.push(translate(lang, 'milAi.advice.live.expeditions', { count: snap.activeExpeditions }));
  }
  if (snap.cyberDefense > 0) {
    candidates.push(translate(lang, 'milAi.advice.live.cyberDefense', { count: snap.cyberDefense }));
  }
  if (fuel?.max && fuel.current >= fuel.max * 0.9) {
    candidates.push(translate(lang, 'milAi.advice.lv3.fuelDepot'));
  }
  if ((energy?.current ?? 0) < 50) {
    candidates.push(translate(lang, 'milAi.advice.energyLow'));
  }
  if (hammadde?.max && hammadde.current <= hammadde.max * 0.12) {
    candidates.push(translate(lang, 'milAi.advice.live.lowMetal'));
  }
  if ((snap.happiness ?? 100) < 42) {
    candidates.push(translate(lang, 'milAi.advice.live.lowMorale', { pct: snap.happiness }));
  }
  if ((snap.taxRate ?? 15) >= 28) {
    candidates.push(translate(lang, 'milAi.advice.live.highTax', { pct: snap.taxRate }));
  }
  if (snap.constructionQueued === 0 && snap.hqLevel >= 2) {
    candidates.push(translate(lang, 'milAi.advice.live.idleBuild'));
  }
  if (snap.unreadReports > 0) {
    candidates.push(translate(lang, 'milAi.advice.live.unreadReports', { count: snap.unreadReports }));
  }
  if (snap.aiLevel >= 5) {
    candidates.push(translate(lang, 'milAi.advice.lv5.botWeak'));
  }

  if (!candidates.length) {
    candidates.push(translate(lang, 'milAi.advice.stable'));
  }

  return candidates[bucket % candidates.length];
}

export function buildMilAiLiveAdviceLine(state, remote, lang = 'tr') {
  const body = pickMilAiLiveAdvice(state, remote, lang);
  if (!body) return null;
  return milAiCommandLine(lang === 'en' ? 'ADVICE' : 'TAVSİYE', body);
}
