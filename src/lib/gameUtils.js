export function parseTimeToSeconds(str) {
  if (!str || str === '—') return 0;
  const parts = String(str).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(str) || 0;
}

export function formatSeconds(total) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatRate(hourly) {
  return `+${Math.round(hourly)}/sa`;
}

export function ratePerSecond(rateStr) {
  const match = rateStr?.match(/\+(\d+)/);
  if (!match) return 0;
  return Number(match[1]) / 3600;
}

export function genId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const BUILDING_RESOURCE_MAP = {
  refinery: 'fuel',
  plant: 'energy',
  market: 'money',
  /** KBRN / ileri Ar-Ge — çok düşük saatlik uranyum (Ar-Ge Sv.8+) */
  research: 'uranium',
};

/** Birincil kaynak dışında ek saatlik üretim (ör. rafineri → hammadde). */
export const BUILDING_EXTRA_RESOURCE_MAP = {
  refinery: { resourceId: 'hammadde', base: 12, perLevel: 2.5 },
};

export const BASE_HOURLY = {
  refinery: 12,
  plant: 8,
  market: 18,
  research: 0.4,
};

export const HOURLY_PER_LEVEL = {
  refinery: 2.5,
  plant: 1.5,
  market: 3,
  research: 0.12,
};

/** Ar-Ge Merkezi bu seviyeden itibaren uranyum üretir */
export const URANIUM_RESEARCH_UNLOCK_LEVEL = 8;

export function computeBuildingHourly(buildingId, level) {
  const base = BASE_HOURLY[buildingId] ?? 0;
  const per = HOURLY_PER_LEVEL[buildingId] ?? 0;
  return base + level * per;
}

export function recalculateResourceRates(buildings, resources, productionMultiplier = 1) {
  const mult = productionMultiplier > 0 ? productionMultiplier : 1;
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  const safeResources = Array.isArray(resources) ? resources : [];
  const hourlyByResource = {};
  for (const b of safeBuildings) {
    const lv = b.level ?? 0;
    if (lv < 1) continue;
    if (b.id === 'research' && lv < URANIUM_RESEARCH_UNLOCK_LEVEL) continue;
    const resId = BUILDING_RESOURCE_MAP[b.id];
    if (resId) {
      hourlyByResource[resId] = (hourlyByResource[resId] || 0) + computeBuildingHourly(b.id, lv);
    }
    const extra = BUILDING_EXTRA_RESOURCE_MAP[b.id];
    if (extra) {
      const extraHourly = extra.base + lv * (extra.perLevel ?? 0);
      hourlyByResource[extra.resourceId] = (hourlyByResource[extra.resourceId] || 0) + extraHourly;
    }
  }

  return safeResources.map((r) => {
    const hourly = hourlyByResource[r.id];
    if (hourly == null) return r;
    const scaled = Math.max(0, Math.floor(hourly * mult));
    return { ...r, rate: formatRate(scaled), vipProductionBonus: mult > 1 };
  });
}

export function createQueueTiming(durationSeconds) {
  const duration = Math.max(1, Math.floor(durationSeconds));
  const startedAt = Date.now();
  return {
    durationSeconds: duration,
    startedAt,
    endsAt: startedAt + duration * 1000,
  };
}

export function remainingFromEndsAt(endsAt, now = Date.now()) {
  if (endsAt == null || Number.isNaN(endsAt)) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function progressFromTiming(startedAt, endsAt, now = Date.now()) {
  if (startedAt == null || endsAt == null) return 0;
  const total = endsAt - startedAt;
  if (!total || total <= 0) return 100;
  const elapsed = now - startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function nowReportDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
