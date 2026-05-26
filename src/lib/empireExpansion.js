import { getHqLevel } from './buildingUtils';
import { getMapMaxDistanceKm, resolveCityCoords } from './expeditionTravel';
import { parseUnitCost } from '../utils/resourceCosts';
import { getResourceMeta } from '../data/resourceCatalog';
import { getCurrentPlayerName } from './playerIdentity';
import {
  findPlayerCityByMapName,
  getMainHqCity,
  isConquerableMapTarget,
  isMainHqCity,
} from './worldCitySystem';
import { IS_WORLD_MAP } from '../map/mapInteractionPolicy';

/** Komuta Merkezi seviyesine göre maksimum şehir slotu (OGame koloni). */
export const CITY_SLOTS_BY_HQ = [
  { minHq: 1, maxCities: 1 },
  { minHq: 5, maxCities: 2 },
  { minHq: 8, maxCities: 3 },
  { minHq: 11, maxCities: 4 },
  { minHq: 14, maxCities: 5 },
  { minHq: 16, maxCities: 6 },
];

export const EMPIRE_MAX_CITIES = 6;
/** Her ek koloni (Ana Merkez hariç) bütçe gelirini %10 düşürür. */
export const EMPIRE_BUDGET_PENALTY_PER_COLONY = 0.1;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180)
    * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getMaxCitySlots(hqLevel) {
  let slots = 1;
  for (const row of CITY_SLOTS_BY_HQ) {
    if (hqLevel >= row.minHq) slots = row.maxCities;
  }
  return slots;
}

export function getEmpireHqLevel(state) {
  let max = 0;
  for (const pc of state.playerCities ?? []) {
    const city = state.cities?.[pc.id];
    max = Math.max(max, getHqLevel(city));
  }
  return max;
}

export function getOwnedCityCount(state) {
  return state.playerCities?.length ?? 0;
}

export function getColonyCount(state) {
  return state.playerCities?.filter((pc) => !isMainHqCity(pc)).length ?? 0;
}

export function getNextSlotHqLevel(currentMaxSlots) {
  const row = CITY_SLOTS_BY_HQ.find((r) => r.maxCities === currentMaxSlots + 1);
  return row?.minHq ?? null;
}

/** Binalar sayfası — Komuta Merkezi kartı bilgi satırı. */
export function formatEmpireSlotHint(state) {
  const hq = getEmpireHqLevel(state);
  const owned = getOwnedCityCount(state);
  const colonies = getColonyCount(state);
  const maxSlots = getMaxCitySlots(hq);

  if (hq < 5 && colonies === 0) {
    return IS_WORLD_MAP
      ? 'Sv.1–4: yalnızca ana ülke — ek ülke için Sv.5 Komuta Merkezi'
      : 'Sv.1–4: yalnızca Ana Merkez — koloni için Sv.5 Komuta Merkezi';
  }
  if (owned >= EMPIRE_MAX_CITIES) {
    return IS_WORLD_MAP
      ? 'İmparatorluk sınırı: 6 ülke (maksimum)'
      : 'İmparatorluk sınırı: 6 şehir (maksimum)';
  }
  if (owned < maxSlots) {
    const free = maxSlots - owned;
    return IS_WORLD_MAP
      ? `Fethedilebilir ülke slotu: ${free} (Sv.${hq} Komuta Merkezi)`
      : `Fethedilebilir koloni slotu: ${free} (Sv.${hq} Komuta Merkezi)`;
  }
  const nextHq = getNextSlotHqLevel(maxSlots);
  if (nextHq == null) {
    return 'Sonraki şehir slotu: Komuta Merkezi maksimum seviyede';
  }
  return `Sonraki şehir slotu: Sv.${nextHq} gerekli`;
}

/** @deprecated Saldırı ile fetih — isConquerableMapTarget kullanın */
export function isColonizableMapTarget(targetCity) {
  return isConquerableMapTarget(targetCity);
}

export function getNearestEmpireOrigin(targetCoords, playerCities, mapCities) {
  if (targetCoords?.lat == null || targetCoords?.lng == null) {
    return { origin: null, distanceKm: 0 };
  }
  let bestOrigin = null;
  let bestKm = Infinity;

  for (const pc of playerCities ?? []) {
    const coords = resolveCityCoords(pc.name, playerCities, mapCities);
    if (!coords) continue;
    const km = haversineKm(coords.lat, coords.lng, targetCoords.lat, targetCoords.lng);
    if (km < bestKm) {
      bestKm = km;
      bestOrigin = coords;
    }
  }

  return {
    origin: bestOrigin,
    distanceKm: Number.isFinite(bestKm) ? bestKm : 0,
  };
}

/** Uzak koloniler — sefer süresi çarpanı (1× … ~2.5×). */
export function getEmpireDistanceTravelMultiplier(distanceKm, mapCities = []) {
  const maxKm = Math.max(1, getMapMaxDistanceKm(mapCities));
  const ratio = Math.min(1, Math.max(0, distanceKm / maxKm));
  return 1 + ratio * 1.5;
}

/** Uzak koloniler — kurulum maliyeti çarpanı (1× … ~3×). */
export function getEmpireManagementCostMultiplier(distanceKm, mapCities = []) {
  const maxKm = Math.max(1, getMapMaxDistanceKm(mapCities));
  const ratio = Math.min(1, Math.max(0, distanceKm / maxKm));
  return 1 + ratio * 2;
}

/** Her ek koloni bütçe (money) gelirini %10 azaltır (Ana Merkez sayılmaz). */
export function getEmpireBudgetIncomeMultiplier(colonyCount) {
  if (colonyCount <= 0) return 1;
  return Math.max(0.25, 1 - colonyCount * EMPIRE_BUDGET_PENALTY_PER_COLONY);
}

/** Çok koloni — yönetim mutluluk baskısı. */
export function getEmpireHappinessPenalty(colonyCount) {
  if (colonyCount < 3) return 0;
  return (colonyCount - 2) * 3;
}

export function scaleResourceCostString(costStr, multiplier) {
  if (!costStr || multiplier <= 1) return costStr;
  const costs = parseUnitCost(costStr);
  if (!costs.length) return costStr;
  return costs
    .map(({ resourceId, amount }) => {
      const meta = getResourceMeta(resourceId);
      const label = meta?.label ?? resourceId;
      const scaled = Math.ceil(amount * multiplier);
      const formatted = scaled >= 1000
        ? scaled.toLocaleString('tr-TR')
        : String(scaled);
      return `${formatted} ${label}`;
    })
    .join(' · ');
}

export function evaluateConquestAttempt(state, targetCity) {
  const owned = getOwnedCityCount(state);
  const hq = getEmpireHqLevel(state);
  const maxSlots = getMaxCitySlots(hq);
  const playerName = getCurrentPlayerName();

  if (!isConquerableMapTarget(targetCity, state)) {
    return { ok: false, reason: 'Bu hedef fethedilemez — yalnızca bot veya düşman kolonisi' };
  }

  const defenderPc = findPlayerCityByMapName(state, targetCity.name);
  if (defenderPc && isMainHqCity(defenderPc)) {
    return { ok: false, reason: 'Ana Merkez fethedilemez — yalnızca yağmalanabilir', raidOnly: true };
  }
  if (defenderPc && targetCity.owner === playerName) {
    return { ok: false, reason: 'Kendi koloninize saldıramazsınız' };
  }
  if (state.playerCities?.some((c) => c.name === targetCity.name)) {
    return { ok: false, reason: 'Bu bölge zaten imparatorluğunuzda' };
  }
  if (owned >= maxSlots) {
    const nextHq = getNextSlotHqLevel(maxSlots);
    if (nextHq != null) {
      return {
        ok: false,
        reason: `Şehir slotu dolu — sonraki slot için Komuta Merkezi Sv.${nextHq} gerekli`,
        maxSlots,
        owned,
        hq,
      };
    }
    return { ok: false, reason: 'Maksimum şehir sayısına ulaşıldı (6)', maxSlots, owned, hq };
  }

  const targetCoords = { lat: targetCity.lat, lng: targetCity.lng };
  const { distanceKm } = getNearestEmpireOrigin(
    targetCoords,
    state.playerCities,
    state.mapCities,
  );

  return {
    ok: true,
    maxSlots,
    owned,
    hq,
    distanceKm,
    travelMult: getEmpireDistanceTravelMultiplier(distanceKm, state.mapCities),
    costMult: getEmpireManagementCostMultiplier(distanceKm, state.mapCities),
  };
}

export function evaluateColonyAttempt(state, targetCity) {
  return evaluateConquestAttempt(state, targetCity);
}

export function getEmpireOverview(state) {
  const owned = getOwnedCityCount(state);
  const colonies = getColonyCount(state);
  const hq = getEmpireHqLevel(state);
  const maxSlots = getMaxCitySlots(hq);
  const mainHq = getMainHqCity(state);
  return {
    owned,
    colonies,
    hq,
    maxSlots,
    mainHqName: mainHq?.name,
    budgetMult: getEmpireBudgetIncomeMultiplier(colonies),
    happinessPenalty: getEmpireHappinessPenalty(colonies),
    slotHint: formatEmpireSlotHint(state),
  };
}
