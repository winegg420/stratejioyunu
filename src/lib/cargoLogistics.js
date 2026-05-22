import { getExpeditionDistanceKm } from './expeditionTravel';
import { getResourceDisplay } from '../data/resourceCatalog';

/** Yalnızca hammadde şehirler arası taşınır. */
export const CARGO_RESOURCE_ID = 'hammadde';

/** Hava Üssü — building catalog id */
export const AIRBASE_BUILDING_ID = 'airport';

export const LOGISTICS_MODE = {
  ROAD: 'road',
  AIR: 'air',
};

/** Karayolu: saniye / km */
export const ROAD_SECONDS_PER_KM = 48;

/** Havayolu: karayolunun %25'i (≈ %75 daha hızlı) */
export const AIR_DURATION_RATIO = 0.25;

export const AIR_LOGISTICS_BASE_COST = 420;
export const AIR_LOGISTICS_COST_PER_KM = 6;

const MIN_ROAD_SECONDS = 90;
const MIN_AIR_SECONDS = 25;

export function getAirportLevel(city) {
  if (!city?.buildings) return 0;
  const b = city.buildings.find((x) => x.id === AIRBASE_BUILDING_ID);
  return b?.level ?? 0;
}

export function canUseAirLogistics(originCity, targetCity) {
  return getAirportLevel(originCity) >= 1 && getAirportLevel(targetCity) >= 1;
}

export function isRoadLogisticsFeasible(distanceKm) {
  return Number.isFinite(distanceKm) && distanceKm >= 0;
}

export function calcRoadCargoSeconds(distanceKm) {
  if (!isRoadLogisticsFeasible(distanceKm)) return MIN_ROAD_SECONDS;
  return Math.max(MIN_ROAD_SECONDS, Math.round(distanceKm * ROAD_SECONDS_PER_KM));
}

export function calcAirCargoSeconds(roadSeconds) {
  return Math.max(MIN_AIR_SECONDS, Math.round(roadSeconds * AIR_DURATION_RATIO));
}

export function calcAirLogisticsCost(distanceKm) {
  const km = Math.max(0, distanceKm ?? 0);
  return AIR_LOGISTICS_BASE_COST + Math.round(km * AIR_LOGISTICS_COST_PER_KM);
}

export function calcCargoTransferDuration({
  originCoords,
  targetCoords,
  mode = LOGISTICS_MODE.ROAD,
}) {
  const distKm = getExpeditionDistanceKm(originCoords, targetCoords);
  const roadSec = calcRoadCargoSeconds(distKm);
  const seconds = mode === LOGISTICS_MODE.AIR
    ? calcAirCargoSeconds(roadSec)
    : roadSec;
  return { seconds, distanceKm: distKm, roadSeconds: roadSec };
}

export function formatCargoLogisticsLabel(mode) {
  return mode === LOGISTICS_MODE.AIR ? 'Havayolu (Ekspres)' : 'Karayolu (Standart)';
}

export function formatCargoAmount(amount) {
  const { label, icon } = getResourceDisplay(CARGO_RESOURCE_ID);
  return `${icon} ${Math.floor(amount).toLocaleString('tr-TR')} ${label}`;
}

export function buildCargoTransitPayload(amount, mode) {
  return {
    resources: { [CARGO_RESOURCE_ID]: Math.floor(amount) },
    logisticsMode: mode,
    inTransit: true,
  };
}

export function getCargoAmountFromPayload(payload) {
  return Math.max(0, Math.floor(Number(payload?.resources?.[CARGO_RESOURCE_ID]) || 0));
}
