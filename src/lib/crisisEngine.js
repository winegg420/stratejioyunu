/**
 * Doğal Afet ve Kriz Motoru — otomatik rastgele olaylar + kurucu müdahalesi.
 */
import { genId } from './gameUtils';
import { getRegionForCoords, CBNS_REGIONS, createNewsFeedEntry } from '../utils/cbrnEngine';
import { getIdlePopulation } from './populationUtils';
import { hasWorkforceShortage, isNewPlayerWorkforceProtected } from './resourceProduction';
import { normalizeIdeology } from './ideologySystem';

export const CRISIS_TYPE = {
  EARTHQUAKE: 'earthquake',
  ECONOMIC: 'economic',
  ENERGY: 'energy',
  MIGRATION: 'migration',
};

export const CRISIS_SEVERITY = {
  LIGHT: 'light',
  MODERATE: 'moderate',
  CATASTROPHIC: 'catastrophic',
};

/** Otomatik tetik — seyrek */
export const CRISIS_MIN_INTERVAL_MS = 14 * 60 * 1000;
export const CRISIS_ROLL_INTERVAL_TICKS = 140;
export const CRISIS_AUTO_TRIGGER_CHANCE = 0.014;

/** Süreler */
export const CRISIS_DURATION_MS = {
  [CRISIS_TYPE.EARTHQUAKE]: 28 * 60 * 1000,
  [CRISIS_TYPE.ECONOMIC]: 42 * 60 * 1000,
  [CRISIS_TYPE.ENERGY]: 32 * 60 * 1000,
  [CRISIS_TYPE.MIGRATION]: 36 * 60 * 1000,
};

export const ADMIN_CRISIS_DURATION_MS = 55 * 60 * 1000;

/** Oyuncu tetikli ekonomik kriz */
export const EXTREME_TAX_RATE = 32;
export const WORKFORCE_IDLE_RATIO_MIN = 0.06;

/** Küresel ekonomik kriz */
export const ECONOMIC_MONEY_PRODUCTION_MULT = 0.6;
export const ECONOMIC_TAX_PENALTY_MULT = 2;

/** Enerji krizi */
export const ENERGY_PLANT_DEBUFF = 0.35;

const PRODUCTION_BUILDING_IDS = ['factory', 'refinery', 'plant', 'farm'];
const BORDER_LAT = { south: 36.8, north: 41.6 };
const BORDER_LNG = { west: 27.2, east: 41.5 };

export const CRISIS_LOYALTY_RESPONSE = {
  socialist_aid: 'socialist_crisis_aid',
  capitalist_fund: 'capitalist_crisis_fund',
  technocrat_shield: 'technocrat_crisis_shield',
  nationalist_mobilize: 'nationalist_crisis_mobilize',
};

const IDEOLOGY_CRISIS_RESPONSE = {
  socialist: CRISIS_LOYALTY_RESPONSE.socialist_aid,
  capitalist: CRISIS_LOYALTY_RESPONSE.capitalist_fund,
  technocrat: CRISIS_LOYALTY_RESPONSE.technocrat_shield,
  nationalist: CRISIS_LOYALTY_RESPONSE.nationalist_mobilize,
};

const AUTO_CRISIS_POOL = [
  CRISIS_TYPE.EARTHQUAKE,
  CRISIS_TYPE.ECONOMIC,
  CRISIS_TYPE.ENERGY,
  CRISIS_TYPE.MIGRATION,
];

export function formatCrisisLabel(type) {
  const map = {
    [CRISIS_TYPE.EARTHQUAKE]: 'Deprem',
    [CRISIS_TYPE.ECONOMIC]: 'Ekonomik Kriz',
    [CRISIS_TYPE.ENERGY]: 'Enerji Krizi',
    [CRISIS_TYPE.MIGRATION]: 'Göç Dalgası',
  };
  return map[type] ?? 'Kriz';
}

export function buildCrisisNewsText({ type, regionName, severity, admin = false }) {
  const label = formatCrisisLabel(type);
  const region = regionName ? ` — ${regionName}` : '';
  if (admin || severity === CRISIS_SEVERITY.CATASTROPHIC) {
    return `[ KÜRESEL ACİL DURUM ]: Kurucu protokolü — ${label}${region}. Tüm hatlar kırmızı alarm!`;
  }
  if (type === CRISIS_TYPE.EARTHQUAKE) {
    return `[ DOĞAL AFET ALARMI ]: ${label}${region}. Altyapı sarsıntısı — üretim hatları yavaşladı.`;
  }
  return `[ KÜRESEL ACİL DURUM ]: ${label}${region}. Başkanlık kriz brifingi yayımlandı.`;
}

export function pruneCrisisEffects(effects = [], now = Date.now()) {
  return (effects ?? []).filter((fx) => fx.endsAt == null || fx.endsAt > now);
}

export function getActiveCrisisProductionDebuff(crisisEffects = [], globalCrisis = null, now = Date.now()) {
  let debuff = 0;
  for (const fx of pruneCrisisEffects(crisisEffects, now)) {
    debuff = Math.max(debuff, fx.productionDebuff ?? 0);
  }
  if (globalCrisis?.active && globalCrisis.type === CRISIS_TYPE.ENERGY && globalCrisis.endsAt > now) {
    debuff = Math.max(debuff, globalCrisis.energyDebuff ?? ENERGY_PLANT_DEBUFF);
  }
  return Math.min(0.55, debuff);
}

export function getCrisisHappinessPenalty(crisisEffects = [], now = Date.now()) {
  return pruneCrisisEffects(crisisEffects, now).reduce(
    (sum, fx) => sum + (fx.happinessDamage ?? 0),
    0,
  );
}

export function getEconomicCrisisMoneyMult(globalCrisis, now = Date.now()) {
  if (!globalCrisis?.active || globalCrisis.type !== CRISIS_TYPE.ECONOMIC) return 1;
  if (globalCrisis.endsAt != null && globalCrisis.endsAt <= now) return 1;
  return globalCrisis.moneyProductionMult ?? ECONOMIC_MONEY_PRODUCTION_MULT;
}

export function getEconomicCrisisTaxPenaltyMult(globalCrisis, now = Date.now()) {
  if (!globalCrisis?.active || globalCrisis.type !== CRISIS_TYPE.ECONOMIC) return 1;
  if (globalCrisis.endsAt != null && globalCrisis.endsAt <= now) return 1;
  return globalCrisis.taxPenaltyMult ?? ECONOMIC_TAX_PENALTY_MULT;
}

export function calcInfrastructureResistance(city) {
  const buildings = city?.buildings ?? [];
  let sum = 0;
  let count = 0;
  for (const id of PRODUCTION_BUILDING_IDS) {
    const b = buildings.find((x) => x.id === id);
    const lv = b?.built ? (b.level ?? 0) : 0;
    sum += lv;
    count += 1;
  }
  const avg = count ? sum / count : 0;
  return Math.min(0.92, avg * 0.085);
}

export function calcEarthquakeImpact(city, severity = CRISIS_SEVERITY.LIGHT) {
  const resistance = calcInfrastructureResistance(city);
  const base = severity === CRISIS_SEVERITY.CATASTROPHIC ? 0.32 : severity === CRISIS_SEVERITY.MODERATE ? 0.18 : 0.12;
  const productionDebuff = Math.max(0.02, base * (1 - resistance));
  const happinessDamage = Math.round(
    (severity === CRISIS_SEVERITY.CATASTROPHIC ? 22 : 10) * (1 - resistance * 0.85),
  );
  const damagedBuildingIds = PRODUCTION_BUILDING_IDS.filter((id) => {
    const lv = city?.buildings?.find((b) => b.id === id)?.level ?? 0;
    return lv < 4 && productionDebuff > 0.06;
  });
  return { productionDebuff, happinessDamage, damagedBuildingIds, resistance };
}

function pickRandomRegion() {
  const idx = Math.floor(Math.random() * CBNS_REGIONS.length);
  return CBNS_REGIONS[idx];
}

export function getMapCitiesInRegion(mapCities, regionId) {
  return (mapCities ?? []).filter((mc) => {
    if (mc.lat == null || mc.lng == null) return false;
    const r = getRegionForCoords(mc.lat, mc.lng);
    return r.id === regionId;
  });
}

export function getPlayerCitiesInRegion(playerCities, mapCities, regionId) {
  const names = new Set(getMapCitiesInRegion(mapCities, regionId).map((c) => c.name));
  return (playerCities ?? []).filter((pc) => names.has(pc.name));
}

function isBorderMapCity(mc) {
  if (mc.lat == null || mc.lng == null) return false;
  return (
    mc.lat <= BORDER_LAT.south
    || mc.lat >= BORDER_LAT.north
    || mc.lng <= BORDER_LNG.west
    || mc.lng >= BORDER_LNG.east
  );
}

export function shouldTriggerPlayerEconomicCrisis(city, taxRate) {
  if (!city) return false;
  if (Number(taxRate) >= EXTREME_TAX_RATE) return { reason: 'extreme_tax', taxRate };
  if (!isNewPlayerWorkforceProtected(city) && hasWorkforceShortage(city)) {
    return { reason: 'workforce_drained' };
  }
  const pop = city.population ?? city.idlePopulation ?? 1;
  const idle = getIdlePopulation(city);
  if (!isNewPlayerWorkforceProtected(city) && idle / Math.max(1, pop) < WORKFORCE_IDLE_RATIO_MIN) {
    return { reason: 'workforce_drained' };
  }
  return null;
}

function createCrisisEffect({ type, endsAt, productionDebuff = 0, happinessDamage = 0, meta = {} }) {
  return {
    id: genId('crfx'),
    type,
    endsAt,
    productionDebuff,
    happinessDamage,
    ...meta,
  };
}

function applyEarthquakeToCities(state, { regionId, regionName, severity, endsAt, admin }) {
  const affectedPc = getPlayerCitiesInRegion(state.playerCities, state.mapCities, regionId);
  const cityPatches = {};
  for (const pc of affectedPc) {
    const city = state.cities[pc.id];
    if (!city) continue;
    const impact = calcEarthquakeImpact(city, severity);
    const effects = [
      ...pruneCrisisEffects(city.crisisEffects),
      createCrisisEffect({
        type: CRISIS_TYPE.EARTHQUAKE,
        endsAt,
        productionDebuff: impact.productionDebuff,
        happinessDamage: impact.happinessDamage,
        meta: { damagedBuildingIds: impact.damagedBuildingIds, regionId },
      }),
    ];
    cityPatches[pc.id] = { ...city, crisisEffects: effects };
  }
  return { cityPatches, affectedCityIds: affectedPc.map((c) => c.id) };
}

function applyMigrationToCities(state, { endsAt, admin }) {
  const borderNames = new Set(
    (state.mapCities ?? []).filter(isBorderMapCity).map((c) => c.name),
  );
  const affectedPc = (state.playerCities ?? []).filter((pc) => borderNames.has(pc.name));
  const cityPatches = {};
  for (const pc of affectedPc) {
    const city = state.cities[pc.id];
    if (!city) continue;
    const food = city.resources?.find((r) => r.id === 'food');
    const maxPop = food?.max ?? 20000;
    const surge = admin ? 4500 : 2200;
    const nextPop = Math.min(maxPop, (food?.current ?? 0) + surge);
    const resources = (city.resources ?? []).map((r) => (
      r.id === 'food' ? { ...r, current: nextPop } : r
    ));
    const effects = [
      ...pruneCrisisEffects(city.crisisEffects),
      createCrisisEffect({
        type: CRISIS_TYPE.MIGRATION,
        endsAt,
        happinessDamage: admin ? 26 : 18,
        meta: { populationSurge: surge },
      }),
    ];
    cityPatches[pc.id] = {
      ...city,
      resources,
      crisisEffects: effects,
      idlePopulation: Math.max(getIdlePopulation(city), Math.floor(surge * 0.35)),
    };
  }
  return { cityPatches, affectedCityIds: affectedPc.map((c) => c.id) };
}

export function buildActiveCrisis({
  type,
  severity = CRISIS_SEVERITY.LIGHT,
  regionId = null,
  regionName = null,
  endsAt,
  admin = false,
  playerTriggered = false,
  scope = 'global',
  affectedCityIds = [],
  meta = {},
}) {
  const now = Date.now();
  return {
    id: genId('crisis'),
    active: true,
    type,
    severity,
    regionId,
    regionName,
    scope,
    startedAt: now,
    endsAt,
    admin,
    playerTriggered,
    affectedCityIds,
    responded: false,
    moneyProductionMult: type === CRISIS_TYPE.ECONOMIC ? ECONOMIC_MONEY_PRODUCTION_MULT : 1,
    taxPenaltyMult: type === CRISIS_TYPE.ECONOMIC ? ECONOMIC_TAX_PENALTY_MULT : 1,
    energyDebuff: type === CRISIS_TYPE.ENERGY ? ENERGY_PLANT_DEBUFF : 0,
    ...meta,
  };
}

/**
 * Kriz tetikle — otomatik, oyuncu veya kurucu.
 */
export function triggerCrisis(state, {
  type,
  severity = CRISIS_SEVERITY.LIGHT,
  admin = false,
  playerTriggered = false,
  regionId = null,
  regionName = null,
  targetCityId = null,
} = {}) {
  const duration = admin ? ADMIN_CRISIS_DURATION_MS : (CRISIS_DURATION_MS[type] ?? 30 * 60 * 1000);
  const endsAt = Date.now() + duration;
  let region = regionId && regionName
    ? { id: regionId, name: regionName }
    : pickRandomRegion();

  if (type === CRISIS_TYPE.EARTHQUAKE && admin) {
    region = { id: 'multi', name: 'Anadolu — Çoklu Hat' };
    severity = CRISIS_SEVERITY.CATASTROPHIC;
  }

  if (targetCityId && state.playerCities?.find((c) => c.id === targetCityId)) {
    const pc = state.playerCities.find((c) => c.id === targetCityId);
    const mapMc = state.mapCities?.find((m) => m.name === pc.name);
    if (mapMc?.lat != null) region = getRegionForCoords(mapMc.lat, mapMc.lng);
  }

  const activeCrisis = buildActiveCrisis({
    type,
    severity,
    regionId: region.id,
    regionName: region.name,
    endsAt,
    admin,
    playerTriggered,
    scope: type === CRISIS_TYPE.ECONOMIC || type === CRISIS_TYPE.ENERGY ? 'global' : 'region',
    meta: {},
  });

  let cityPatches = {};
  let affectedCityIds = [];

  if (type === CRISIS_TYPE.EARTHQUAKE) {
    if (admin) {
      for (const r of CBNS_REGIONS) {
        const patch = applyEarthquakeToCities(state, {
          regionId: r.id,
          regionName: r.name,
          severity,
          endsAt,
          admin: true,
        });
        cityPatches = { ...cityPatches, ...patch.cityPatches };
        affectedCityIds = [...affectedCityIds, ...patch.affectedCityIds];
      }
    } else {
      const patch = applyEarthquakeToCities(state, {
        regionId: region.id,
        regionName: region.name,
        severity,
        endsAt,
        admin: false,
      });
      cityPatches = patch.cityPatches;
      affectedCityIds = patch.affectedCityIds;
    }
  } else if (type === CRISIS_TYPE.MIGRATION) {
    const patch = applyMigrationToCities(state, { endsAt, admin });
    cityPatches = patch.cityPatches;
    affectedCityIds = patch.affectedCityIds;
    activeCrisis.scope = 'border';
  } else if (type === CRISIS_TYPE.ECONOMIC && playerTriggered && targetCityId) {
    activeCrisis.scope = 'city';
    activeCrisis.targetCityId = targetCityId;
    const city = state.cities[targetCityId];
    if (city) {
      cityPatches[targetCityId] = {
        ...city,
        crisisEffects: [
          ...pruneCrisisEffects(city.crisisEffects),
          createCrisisEffect({
            type: CRISIS_TYPE.ECONOMIC,
            endsAt,
            productionDebuff: 0.14,
            happinessDamage: 14,
          }),
        ],
      };
      affectedCityIds = [targetCityId];
    }
  }

  activeCrisis.affectedCityIds = affectedCityIds;

  const newsItem = createNewsFeedEntry({
    type: admin || severity === CRISIS_SEVERITY.CATASTROPHIC ? 'crisis-emergency' : 'crisis-alarm',
    text: buildCrisisNewsText({
      type,
      regionName: region.name,
      severity,
      admin,
    }),
  });

  return {
    activeCrisis,
    cityPatches,
    mapCities: state.mapCities,
    newsItem,
    lastCrisisEventAt: Date.now(),
    saveCrisis: true,
  };
}

function resolveCrisisEnd(state, now = Date.now()) {
  const crisis = state.activeCrisis;
  if (!crisis?.active || crisis.endsAt > now) return null;

  const cityPatches = {};
  for (const [id, city] of Object.entries(state.cities ?? {})) {
    const pruned = pruneCrisisEffects(city.crisisEffects, now);
    if (pruned.length !== (city.crisisEffects ?? []).length) {
      cityPatches[id] = { ...city, crisisEffects: pruned };
    }
  }

  const newsItem = createNewsFeedEntry({
    type: 'crisis-alarm',
    text: `[ KRİZ SONU ]: ${formatCrisisLabel(crisis.type)} protokolü kapatıldı — operasyonel normalleşme.`,
    at: now,
  });

  return {
    activeCrisis: { ...crisis, active: false, endedAt: now },
    cityPatches,
    newsItem,
    saveCrisis: true,
  };
}

export function tickCrisisWorldEvents(state, now = Date.now()) {
  const patches = {};
  let newsToAdd = [];

  const endPatch = resolveCrisisEnd(state, now);
  if (endPatch) {
    patches.activeCrisis = endPatch.activeCrisis;
    patches.cities = { ...(state.cities ?? {}), ...endPatch.cityPatches };
    patches.saveCrisis = true;
    newsToAdd.push(endPatch.newsItem);
  }

  const current = patches.activeCrisis ?? state.activeCrisis;
  const lastAt = state.lastCrisisEventAt ?? 0;
  const tickCount = (state._crisisTickCount ?? 0) + 1;
  patches._crisisTickCount = tickCount;

  const canRoll = !current?.active
    && now - lastAt >= CRISIS_MIN_INTERVAL_MS
    && tickCount % CRISIS_ROLL_INTERVAL_TICKS === 0;

  if (canRoll && Math.random() < CRISIS_AUTO_TRIGGER_CHANCE) {
    const type = AUTO_CRISIS_POOL[Math.floor(Math.random() * AUTO_CRISIS_POOL.length)];
    const triggered = triggerCrisis(
      { ...state, ...patches },
      { type, severity: CRISIS_SEVERITY.LIGHT },
    );
    if (triggered) {
      patches.activeCrisis = triggered.activeCrisis;
      patches.cities = { ...state.cities, ...triggered.cityPatches };
      patches.lastCrisisEventAt = triggered.lastCrisisEventAt;
      patches.saveCrisis = true;
      newsToAdd.push(triggered.newsItem);
    }
  }

  if (newsToAdd.length) {
    patches.newsLog = [...newsToAdd, ...(state.newsLog ?? [])].slice(0, 48);
  }

  return Object.keys(patches).length ? patches : null;
}

export function getExpectedCrisisResponse(ideology) {
  return IDEOLOGY_CRISIS_RESPONSE[normalizeIdeology(ideology)] ?? null;
}

export function isCorrectCrisisResponse(ideology, responseKey) {
  return getExpectedCrisisResponse(ideology) === responseKey;
}

/** Oturum yenileme — aktif kriz şehir debuff'larını yeniden uygular (haber üretmez) */
export function rehydrateCrisisCityEffects(state, now = Date.now()) {
  const crisis = state.activeCrisis;
  if (!crisis?.active || (crisis.endsAt != null && crisis.endsAt <= now)) {
    return {};
  }
  const endsAt = crisis.endsAt ?? now + 60_000;
  const severity = crisis.severity ?? CRISIS_SEVERITY.LIGHT;
  const cityPatches = {};

  if (crisis.type === CRISIS_TYPE.EARTHQUAKE) {
    const regions = crisis.admin
      ? CBNS_REGIONS
      : [{ id: crisis.regionId, name: crisis.regionName }];
    for (const r of regions) {
      if (!r?.id) continue;
      Object.assign(
        cityPatches,
        applyEarthquakeToCities(state, {
          regionId: r.id,
          regionName: r.name,
          severity,
          endsAt,
          admin: crisis.admin,
        }).cityPatches,
      );
    }
  } else if (crisis.type === CRISIS_TYPE.MIGRATION) {
    Object.assign(cityPatches, applyMigrationToCities(state, { endsAt, admin: crisis.admin }).cityPatches);
  } else if (crisis.type === CRISIS_TYPE.ECONOMIC && crisis.targetCityId && state.cities[crisis.targetCityId]) {
    const city = state.cities[crisis.targetCityId];
    cityPatches[crisis.targetCityId] = {
      ...city,
      crisisEffects: [
        ...pruneCrisisEffects(city.crisisEffects, now),
        createCrisisEffect({
          type: CRISIS_TYPE.ECONOMIC,
          endsAt,
          productionDebuff: 0.14,
          happinessDamage: 14,
        }),
      ],
    };
  }

  return cityPatches;
}
