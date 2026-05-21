/**
 * Sunucu geneli admin yayın ayarları + admin_logs — Supabase veya localStorage demo.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import {
  ADMIN_LOG_TAG,
  DEFAULT_SERVER_ID,
  getDefaultServerBroadcast,
  normalizeCentralBank,
  normalizeRegionalIncentive,
} from './adminOverrideEngine';

const LOCAL_BROADCAST_KEY = 'strateji_server_broadcast';
const LOCAL_LOGS_KEY = 'strateji_admin_logs';

function readLocalBroadcast() {
  if (typeof window === 'undefined') return getDefaultServerBroadcast();
  try {
    const raw = localStorage.getItem(LOCAL_BROADCAST_KEY);
    if (!raw) return getDefaultServerBroadcast();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultServerBroadcast(),
      ...parsed,
      centralBank: normalizeCentralBank(parsed.centralBank),
      regionalIncentive: normalizeRegionalIncentive(parsed.regionalIncentive),
    };
  } catch {
    return getDefaultServerBroadcast();
  }
}

function writeLocalBroadcast(broadcast) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_BROADCAST_KEY, JSON.stringify(broadcast));
}

function readLocalLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalLogs(logs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs.slice(0, 120)));
}

export async function fetchServerBroadcast(serverId = DEFAULT_SERVER_ID) {
  if (!isSupabaseConfigured || !supabase) {
    return readLocalBroadcast();
  }
  const { data, error } = await supabase
    .from('server_broadcast')
    .select('*')
    .eq('server_id', serverId)
    .maybeSingle();

  if (error) {
    console.warn('[adminBroadcast] load', error);
    return readLocalBroadcast();
  }

  if (!data) {
    return getDefaultServerBroadcast();
  }

  return {
    serverId: data.server_id,
    centralBank: normalizeCentralBank(data.central_bank),
    regionalIncentive: normalizeRegionalIncentive(data.regional_incentive),
    updatedAt: data.updated_at,
  };
}

export async function saveServerBroadcast(broadcast, serverId = DEFAULT_SERVER_ID) {
  const payload = {
    server_id: serverId,
    central_bank: normalizeCentralBank(broadcast.centralBank),
    regional_incentive: broadcast.regionalIncentive ?? null,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase) {
    writeLocalBroadcast({
      ...broadcast,
      centralBank: payload.central_bank,
      regionalIncentive: normalizeRegionalIncentive(payload.regional_incentive),
      updatedAt: payload.updated_at,
    });
    return { ok: true, source: 'local' };
  }

  const { error } = await supabase.from('server_broadcast').upsert(payload);
  if (error) {
    console.warn('[adminBroadcast] save', error);
    return { ok: false, error };
  }
  writeLocalBroadcast({
    ...broadcast,
    updatedAt: payload.updated_at,
  });
  return { ok: true, source: 'supabase' };
}

export async function fetchAdminLogs(serverId = DEFAULT_SERVER_ID, limit = 80) {
  if (!isSupabaseConfigured || !supabase) {
    return readLocalLogs().slice(0, limit);
  }

  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .eq('server_id', serverId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[adminLogs] fetch', error);
    return readLocalLogs().slice(0, limit);
  }
  return data ?? [];
}

export async function insertAdminLog({
  actorName,
  actionType,
  logText,
  payload = {},
  serverId = DEFAULT_SERVER_ID,
}) {
  const row = {
    id: crypto.randomUUID?.() ?? `local-${Date.now()}`,
    server_id: serverId,
    actor_name: actorName,
    action_type: actionType,
    log_text: logText.startsWith(ADMIN_LOG_TAG) ? logText : `${ADMIN_LOG_TAG} ${logText}`,
    payload,
    created_at: new Date().toISOString(),
  };

  const localLogs = [row, ...readLocalLogs()];
  writeLocalLogs(localLogs);

  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, row, source: 'local' };
  }

  const { data, error } = await supabase
    .from('admin_logs')
    .insert({
      server_id: serverId,
      actor_name: actorName,
      action_type: actionType,
      log_text: row.log_text,
      payload,
    })
    .select()
    .single();

  if (error) {
    console.warn('[adminLogs] insert', error);
    return { ok: false, error, row };
  }
  return { ok: true, row: data ?? row, source: 'supabase' };
}
