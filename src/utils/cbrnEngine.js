/**
 * KBRN / CBRN — silah geliştirme, sinsi operasyonlar, AI global salgınlar.
 */
import { genId, nowReportDate } from '../lib/gameUtils';
import { inferCityTier } from '../map/cyberMapConfig';
import {
  canTraceKbrnAttacker,
  getDecontaminationLevel,
  getDecontaminationMitigationFactor,
  getKbrnDetectionLevel,
  getWeaponDevelopmentLevel,
  isImmuneToGlobalOutbreak,
  KBRN_RESEARCH_IDS,
} from '../lib/kbrnResearch';
import { calcCyberVirusTravelSeconds, getSpyTechnologyLevel } from './spyEngine';

export const CBNS_STEALTH_DURATION_MS = 60 * 60 * 1000;
export const CBNS_GLOBAL_OUTBREAK_DURATION_MS = 45 * 60 * 1000;
export const CBNS_STEALTH_PRODUCTION_DEBUFF = 0.3;
export const CBNS_STEALTH_HAPPINESS_DEBUFF = 0.3;

/** Minimum tick aralığı (ms) — yeni salgın tetikleme */
export const CBNS_EVENT_MIN_INTERVAL_MS = 8 * 60 * 1000;
export const CBNS_EVENT_ROLL_INTERVAL_TICKS = 90;
export const CBNS_EVENT_TRIGGER_CHANCE = 0.028;

export const CBNS_REGIONS = [
  { id: 'marmara', name: "Marmara Bölgesi", latMin: 40.15, latMax: 41.85, lngMin: 26.0, lngMax: 30.8 },
  { id: 'ege', name: 'Ege Bölgesi', latMin: 37.4, latMax: 40.15, lngMin: 26.0, lngMax: 29.8 },
  { id: 'icanadolu', name: 'İç Anadolu', latMin: 38.2, latMax: 41.2, lngMin: 30.5, lngMax: 36.5 },
  { id: 'karadeniz', name: 'Karadeniz Bölgesi', latMin: 40.2, latMax: 42.5, lngMin: 34.5, lngMax: 42.0 },
  { id: 'akdeniz', name: 'Akdeniz Bölgesi', latMin: 36.0, latMax: 38.5, lngMin: 29.5, lngMax: 36.8 },
];

export const CBNS_CHEM_OP_ID = 'chem_pressure';

export function getRegionForCoords(lat, lng) {
  for (const r of CBNS_REGIONS) {
    if (lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax) {
      return r;
    }
  }
  return { id: 'anadolu', name: 'Anadolu Hattı' };
}

export function buildGlobalAlarmNewsText(regionName) {
  return `[ GLOBAL ALARM ]: ${regionName}'nde KBRN Tehdidi Tespit Edildi! Bölgedeki şehirler karantinaya alınıyor.`;
}

export function formatNewsTickerTime(now = Date.now()) {
  return new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function createNewsFeedEntry({ text, type = 'kbrn', at = Date.now() }) {
  return { id: genId('news'), type, text, time: formatNewsTickerTime(at), at };
}

/** Çok yüksek istihbarat — sinsi saldırgan kimliği */
export function canRevealStealthAttacker({ detectionLevel, spyLevel }) {
  const score = detectionLevel * 2 + spyLevel;
  return score >= 14 || canTraceKbrnAttacker({ detectionLevel, spyLevel: spyLevel + 4 });
}

export function getCbrnChemOpCost(weaponLevel) {
  const mult = 1 + Math.max(0, weaponLevel - 1) * 0.14;
  const base = '120.000 para · 55.000 metal · 22.000 enerji · 15.000 yemek · 8.000 reaktör';
  return base
    .split('·')
    .map((part) => {
      const match = part.trim().match(/([\d.,]+)\s+(\S+)/);
      if (!match) return part.trim();
      const n = Number(match[1].replace(/\./g, '').replace(',', '.'));
      return `${Math.ceil(n * mult).toLocaleString('tr-TR')} ${match[2]}`;
    })
    .join(' · ');
}

export function resolveDefenderDeconLevel({ defenderCity, defenderResearches, mapCity } = {}) {
  if (defenderResearches) return getDecontaminationLevel(defenderResearches);
  if (defenderCity?.researches) return getDecontaminationLevel(defenderCity.researches);
  const tier = mapCity ? inferCityTier(mapCity) : 'default';
  const scale = tier === 'capital' ? 1.35 : tier === 'metropolis' ? 1.1 : 0.85;
  return Math.max(0, Math.floor(2 * scale));
}

export function calcCbrnIntrusionChance(attackerWeapon, defenderDecon) {
  const diff = attackerWeapon - defenderDecon;
  if (diff >= 3) return 1;
  if (diff === 2) return 0.9;
  if (diff === 1) return 0.72;
  if (diff === 0) return 0.5;
  if (diff === -1) return 0.24;
  if (diff === -2) return 0.1;
  return 0.04;
}

export function rollCbrnIntrusion(attackerWeapon, defenderDecon) {
  const diff = attackerWeapon - defenderDecon;
  const chance = calcCbrnIntrusionChance(attackerWeapon, defenderDecon);
  const guaranteed = diff >= 3;
  const success = guaranteed || Math.random() < chance;
  return {
    success,
    chance,
    diff,
    attackerWeapon,
    defenderDecon,
    guaranteed,
    neutralized: !success,
  };
}

export function buildStealthWeaponIntensity(weaponLevel) {
  const lv = Math.max(1, weaponLevel);
  return {
    happinessDebuffPercent: Math.min(0.5, CBNS_STEALTH_HAPPINESS_DEBUFF + lv * 0.015),
    productionDebuff: Math.min(0.55, CBNS_STEALTH_PRODUCTION_DEBUFF + lv * 0.02),
    barracksBlock: Math.min(0.8, 0.35 + lv * 0.035),
    populationDrain: Math.round(220 + lv * 55),
  };
}

export function createStealthCbrnEffect({
  weaponLevel,
  sourceCityName,
  sourcePlayer,
  deconMitigation = 1,
  stealth = true,
}) {
  const raw = buildStealthWeaponIntensity(weaponLevel);
  const m = Math.max(0.05, Math.min(1, deconMitigation));
  const now = Date.now();
  const durationMs = Math.round(CBNS_STEALTH_DURATION_MS * m);

  return {
    id: genId('kbrn'),
    opId: CBNS_CHEM_OP_ID,
    name: 'KBRN Silahı — Sinsi Baskı',
    kind: stealth ? 'stealth_weapon' : 'weapon',
    stealth,
    sourceCityName: stealth ? null : sourceCityName,
    sourcePlayer: stealth ? null : sourcePlayer,
    startedAt: now,
    endsAt: now + durationMs,
    happinessDebuffPercent: raw.happinessDebuffPercent * m,
    productionDebuff: raw.productionDebuff * m,
    barracksBlock: raw.barracksBlock * m,
    populationDrain: Math.round(raw.populationDrain * m),
  };
}

export function createGlobalOutbreakEffect({ outbreakId, regionName, deconMitigation = 1 }) {
  const m = Math.max(0.08, Math.min(1, deconMitigation));
  const now = Date.now();
  return {
    id: genId('kbrn'),
    opId: 'global_outbreak',
    name: 'Bölgesel KBRN Salgını',
    kind: 'global_outbreak',
    outbreakId,
    regionName,
    sourcePlayer: null,
    sourceCityName: null,
    startedAt: now,
    endsAt: now + Math.round(CBNS_GLOBAL_OUTBREAK_DURATION_MS * m),
    happinessDebuffPercent: 0.48 * m,
    productionDebuff: 0.42 * m,
    barracksBlock: 0.55 * m,
    populationDrain: Math.round(650 * m),
    quarantine: true,
  };
}

export function pickCitiesInRegion(mapCities, region, count = 3) {
  const inRegion = (mapCities ?? []).filter((c) => {
    const r = getRegionForCoords(c.lat, c.lng);
    return r.id === region.id;
  });
  if (inRegion.length === 0) return [];
  const shuffled = [...inRegion].sort(() => Math.random() - 0.5);
  const n = Math.min(count, shuffled.length, Math.max(2, Math.min(3, shuffled.length)));
  return shuffled.slice(0, n);
}

/**
 * AI — rastgele bölgesel KBRN salgını tetikle.
 */
export function triggerRandomCbrnEvent(state) {
  if (state.globalCbrnOutbreak?.active) return null;

  const mapCities = state.mapCities ?? [];
  if (mapCities.length < 2) return null;

  const region = CBNS_REGIONS[Math.floor(Math.random() * CBNS_REGIONS.length)];
  const affectedMapCities = pickCitiesInRegion(mapCities, region, 2 + Math.floor(Math.random() * 2));
  if (affectedMapCities.length < 2) {
    const fallback = [...mapCities].sort(() => Math.random() - 0.5).slice(0, 3);
    if (fallback.length < 2) return null;
    affectedMapCities.length = 0;
    affectedMapCities.push(...fallback);
  }

  const now = Date.now();
  const outbreakId = genId('outbreak');
  const endsAt = now + CBNS_GLOBAL_OUTBREAK_DURATION_MS;
  const researches = state.researches ?? [];
  const playerCityByName = Object.fromEntries(
    (state.playerCities ?? []).map((pc) => [pc.name, pc.id]),
  );

  const cityPatches = {};
  const mapCityPatches = mapCities.map((mc) => {
    const hit = affectedMapCities.some((a) => a.name === mc.name);
    if (!hit) return mc;
    return { ...mc, quarantine: true, cbrnOutbreak: outbreakId };
  });

  for (const mc of affectedMapCities) {
    const pcId = playerCityByName[mc.name];
    if (!pcId || !state.cities[pcId]) continue;
    const city = state.cities[pcId];
    const decon = getDecontaminationLevel(researches);
    if (isImmuneToGlobalOutbreak(decon)) continue;

    const mitigation = getDecontaminationMitigationFactor(decon);
    const effect = createGlobalOutbreakEffect({
      outbreakId,
      regionName: region.name,
      deconMitigation: mitigation,
    });
    cityPatches[pcId] = {
      ...city,
      kbrnEffects: [...(city.kbrnEffects ?? []), effect],
      quarantine: true,
    };
  }

  const globalCbrnOutbreak = {
    id: outbreakId,
    active: true,
    regionId: region.id,
    regionName: region.name,
    startedAt: now,
    endsAt,
    affectedCityNames: affectedMapCities.map((c) => c.name),
  };

  const newsItem = createNewsFeedEntry({
    type: 'global-alarm',
    text: buildGlobalAlarmNewsText(region.name),
    at: now,
  });

  return {
    globalCbrnOutbreak,
    mapCities: mapCityPatches,
    cityPatches,
    newsItem,
    lastCbrnEventAt: now,
  };
}

export function resolveGlobalOutbreakEnd(state, now = Date.now()) {
  const outbreak = state.globalCbrnOutbreak;
  if (!outbreak?.active || outbreak.endsAt > now) return null;

  const affected = new Set(outbreak.affectedCityNames ?? []);
  const cityPatches = {};
  for (const [cityId, city] of Object.entries(state.cities ?? {})) {
    const pc = state.playerCities?.find((p) => p.id === cityId);
    if (!pc || !affected.has(pc.name)) continue;
    const kbrnEffects = (city.kbrnEffects ?? []).filter(
      (fx) => fx.outbreakId !== outbreak.id,
    );
    cityPatches[cityId] = { ...city, kbrnEffects, quarantine: false };
  }

  const mapCities = (state.mapCities ?? []).map((mc) => (
    affected.has(mc.name)
      ? { ...mc, quarantine: false, cbrnOutbreak: undefined }
      : mc
  ));

  const newsItem = createNewsFeedEntry({
    type: 'kbrn',
    text: `[ KBRN ]: ${outbreak.regionName} salgını sona erdi — karantina kaldırıldı.`,
    at: now,
  });

  return {
    globalCbrnOutbreak: { ...outbreak, active: false, endedAt: now },
    cityPatches,
    mapCities,
    newsItem,
  };
}

/**
 * Tick — salgın bitişi + rastgele yeni olay.
 */
export function tickCbrnWorldEvents(state, now = Date.now()) {
  const patches = {};
  let newsToAdd = [];

  const endPatch = resolveGlobalOutbreakEnd(state, now);
  if (endPatch) {
    patches.globalCbrnOutbreak = endPatch.globalCbrnOutbreak;
    patches.mapCities = endPatch.mapCities;
    patches.cities = { ...(state.cities ?? {}), ...endPatch.cityPatches };
    patches.saveCbrn = true;
    newsToAdd.push(endPatch.newsItem);
  }

  const current = patches.globalCbrnOutbreak ?? state.globalCbrnOutbreak;
  const lastAt = state.lastCbrnEventAt ?? 0;
  const tickCount = (state._cbrnTickCount ?? 0) + 1;
  patches._cbrnTickCount = tickCount;

  const canRoll = !current?.active
    && now - lastAt >= CBNS_EVENT_MIN_INTERVAL_MS
    && tickCount % CBNS_EVENT_ROLL_INTERVAL_TICKS === 0;

  if (canRoll && Math.random() < CBNS_EVENT_TRIGGER_CHANCE) {
    const triggered = triggerRandomCbrnEvent({ ...state, ...patches });
    if (triggered) {
      patches.globalCbrnOutbreak = triggered.globalCbrnOutbreak;
      patches.mapCities = triggered.mapCities;
      patches.cities = { ...state.cities, ...triggered.cityPatches };
      patches.lastCbrnEventAt = triggered.lastCbrnEventAt;
      patches.saveCbrn = true;
      newsToAdd.push(triggered.newsItem);
    }
  }

  if (newsToAdd.length) {
    patches.newsLog = [...newsToAdd, ...(state.newsLog ?? [])].slice(0, 48);
  }

  return Object.keys(patches).length ? patches : null;
}

export function formatCbrnProtocolFields(researches) {
  const weapon = getWeaponDevelopmentLevel(researches);
  const decon = getDecontaminationLevel(researches);
  const detect = getKbrnDetectionLevel(researches);
  return [
    { key: 'kbrn_weapon', label: 'KBRN Silahı Geliştirme', value: weapon > 0 ? `Sv.${weapon}` : 'Yok', category: 'kbrn' },
    { key: 'kbrn_decon', label: 'Dekontaminasyon / Panzehir', value: decon > 0 ? `Sv.${decon}` : 'Yok', category: 'kbrn' },
    { key: 'kbrn_detect', label: 'Erken Uyarı & Tespit', value: detect > 0 ? `Sv.${detect}` : 'Yok', category: 'kbrn' },
  ];
}

function buildKbrnLedgerLines(opts) {
  const lines = [
    '[ KBRN OPS LEDGER ]',
    `STATUS: ${opts.status}`,
    `TARGET: ${opts.target}`,
    `VECTOR: Sinsi KBRN ×${opts.agentCount}`,
    '---',
    `ATTACKER_WEAPON: Lv.${opts.attackerWeapon}`,
    `DEFENDER_DECON: Lv.${opts.defenderDecon}`,
    `INTRUSION: ${opts.chancePct}%${opts.guaranteed ? ' (GUARANTEED)' : ''}`,
    `STEALTH: ${opts.stealth ? 'ACTIVE — haber akışında gizli' : 'OFF'}`,
  ];
  if (opts.status === 'SUCCESS') {
    lines.push('PAYLOAD: CONTAMINATION (1h · üretim %30 baltalı)');
  } else if (opts.neutralized) {
    lines.push('PAYLOAD: NEUTRALIZED — panzehir');
  } else {
    lines.push('PAYLOAD: BLOCKED');
  }
  if (opts.traceLine) lines.push(opts.traceLine);
  lines.push(`TIMESTAMP: ${new Date().toISOString()}`);
  return lines;
}

export function buildKbrnOpsReport({
  expedition,
  roll,
  agentCount,
  attackerName,
  defenderName,
  target,
  deconMitigation,
  attackerTrace,
  stealth = true,
}) {
  const status = roll.success ? 'SUCCESS' : 'FAILED';
  const chancePct = Math.round(roll.chance * 100);

  const kbrnLedger = {
    status,
    diff: roll.diff,
    attackerWeapon: roll.attackerWeapon,
    defenderDecon: roll.defenderDecon,
    chancePct,
    guaranteed: roll.guaranteed,
    neutralized: roll.neutralized,
    agentCount,
    stealth,
    attackerTrace: attackerTrace ?? null,
    lines: buildKbrnLedgerLines({
      status,
      target: target ?? expedition?.target,
      agentCount,
      attackerWeapon: roll.attackerWeapon,
      defenderDecon: roll.defenderDecon,
      chancePct,
      guaranteed: roll.guaranteed,
      neutralized: roll.neutralized,
      stealth,
      traceLine: attackerTrace
        ? `TRACE: ${attackerTrace.player} @ ${attackerTrace.originCity}`
        : 'TRACE: ANONIM — istihbarat yetersiz',
    }),
  };

  return {
    id: genId('r'),
    filterType: 'kbrn',
    type: stealth ? 'KBRN Sinsi Operasyon' : 'KBRN Kimyasal Baskı',
    title: `${target ?? expedition?.target} — KBRN Operasyonu`,
    date: nowReportDate(),
    preview: `[ KBRN OPS LEDGER ]: ${status}`,
    winner: roll.success ? attackerName : defenderName ?? target,
    targetCity: target ?? expedition?.target,
    kbrnSuccess: roll.success,
    kbrnLedger,
    kbrnStealth: stealth,
    findings: roll.success
      ? 'Sinsi KBRN başarılı — nüfus/moral/üretim 1 saat felç (kaynak gizli)'
      : 'Operasyon başarısız veya panzehir engelledi',
    attacker: stealth && !attackerTrace ? 'Anonim' : attackerName,
    defender: defenderName ?? target,
    originCityId: expedition?.originCityId,
    attackerTrace: attackerTrace ?? null,
    isNew: true,
  };
}

export function buildKbrnDefenderAlertReport({
  target,
  roll,
  attackerTrace,
  effectApplied,
}) {
  const traced = Boolean(attackerTrace?.player);
  return {
    id: genId('r'),
    filterType: 'kbrn',
    type: 'KBRN Alarm',
    title: `${target} — KBRN Alarmı`,
    date: nowReportDate(),
    preview: traced
      ? `[ KBRN ALERT ] Kaynak: ${attackerTrace.player} (${attackerTrace.originCity})`
      : '[ KBRN ALERT ] Sinsi saldırı — kaynak tespit edilemedi',
    kbrnSuccess: false,
    kbrnAlert: true,
    findings: effectApplied
      ? 'Kontaminasyon — panzehir hasarı azalttı.'
      : 'Panzehir protokolü saldırıyı nötralize etti.',
    attackerTrace: traced ? attackerTrace : null,
    targetCity: target,
    isNew: true,
  };
}

export function resolveKbrnChemMission({
  expedition,
  attackerResearches,
  defenderResearches,
  defenderCity,
  mapCity,
  agentCount = 1,
  attackerName,
}) {
  const count = Math.max(1, Math.floor(Number(agentCount) || 1));
  const attackerWeapon = getWeaponDevelopmentLevel(attackerResearches);
  const defenderDecon = defenderResearches
    ? getDecontaminationLevel(defenderResearches)
    : resolveDefenderDeconLevel({ defenderCity, defenderResearches, mapCity });
  const roll = rollCbrnIntrusion(attackerWeapon, defenderDecon);
  const deconMitigation = getDecontaminationMitigationFactor(defenderDecon);
  const target = expedition?.target ?? mapCity?.name;

  let attackerTrace = null;
  if (defenderCity || defenderResearches) {
    const detectionLevel = getKbrnDetectionLevel(
      defenderResearches ?? defenderCity?.researches ?? [],
    );
    const spyLevel = getSpyTechnologyLevel({
      researches: defenderResearches ?? [],
      buildings: defenderCity?.buildings ?? [],
    });
    if (roll.success && canRevealStealthAttacker({ detectionLevel, spyLevel })) {
      attackerTrace = {
        player: attackerName,
        originCity: expedition?.originCityName ?? 'Bilinmiyor',
      };
    }
  }

  const report = buildKbrnOpsReport({
    expedition,
    roll,
    agentCount: count,
    attackerName,
    defenderName: mapCity?.owner || target,
    target,
    deconMitigation,
    attackerTrace: roll.success ? attackerTrace : null,
    stealth: true,
  });

  let effect = null;
  if (roll.success) {
    effect = createStealthCbrnEffect({
      weaponLevel: attackerWeapon,
      sourceCityName: expedition?.originCityName,
      sourcePlayer: attackerName,
      deconMitigation,
      stealth: true,
    });
  }

  return {
    success: roll.success,
    roll,
    report,
    effect,
    attackerTrace,
    stealth: true,
    agentsReturned: roll.success ? count : 0,
    agentsLost: roll.success ? 0 : count,
    deconMitigation,
  };
}

export function calcKbrnChemTravelSeconds({ origin, target, agentCount = 1, mapCities = [] }) {
  const base = calcCyberVirusTravelSeconds({ origin, target, agentCount, mapCities });
  return Math.max(90, Math.round(base * 1.35));
}
