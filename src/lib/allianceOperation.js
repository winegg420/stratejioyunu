import { genId } from './gameUtils';
import { calcExpeditionTravelSeconds, resolveCityCoords } from './expeditionTravel';

export const ALLIANCE_OP_STATUS = {
  PLANNING: 'planning',
  LAUNCHED: 'launched',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled',
};

const COORD_TOLERANCE_MS = 90_000;

export function createAllianceOperation({
  targetName,
  targetLat,
  targetLng,
  leader,
  allianceName,
  now = Date.now(),
}) {
  return {
    id: genId('aop'),
    targetName,
    targetLat,
    targetLng,
    leader,
    allianceName,
    status: ALLIANCE_OP_STATUS.PLANNING,
    participants: [],
    launchAt: null,
    createdAt: now,
    newsPosted: false,
  };
}

export function approveAllianceParticipant(op, {
  player,
  expeditionId,
  endsAt,
  originCityName,
}) {
  const participants = [...(op.participants ?? [])];
  const idx = participants.findIndex((p) => p.player === player);
  const row = {
    player,
    approved: true,
    expeditionId,
    endsAt,
    originCityName,
    arrived: false,
  };
  if (idx >= 0) participants[idx] = row;
  else participants.push(row);
  return { ...op, participants };
}

/** Tüm onaylı katılımcıların aynı anda varması için launchAt */
export function computeCoordinatedLaunchAt(participants, fallbackEndsAt) {
  const ends = (participants ?? [])
    .filter((p) => p.approved && p.endsAt)
    .map((p) => p.endsAt);
  if (!ends.length) return fallbackEndsAt ?? null;
  return Math.max(...ends);
}

export function evaluateOperationArrivals(op, now = Date.now()) {
  const launchAt = op.launchAt;
  if (!launchAt || now < launchAt) {
    return { onTime: [], late: [], ready: false };
  }

  const onTime = [];
  const late = [];

  for (const p of op.participants ?? []) {
    if (!p.approved || !p.endsAt) continue;
    if (Math.abs(p.endsAt - launchAt) <= COORD_TOLERANCE_MS) onTime.push(p);
    else late.push(p);
  }

  return {
    onTime,
    late,
    ready: onTime.length > 0,
    coordinated: late.length === 0 && onTime.length >= 2,
  };
}

export function buildOperationNewsText(op) {
  const count = (op.participants ?? []).filter((p) => p.approved).length;
  return `[ İTTİFAK OPERASYONU ] ${op.targetName} — ${count} müttefik onayladı (Lider: ${op.leader})`;
}

export function planParticipantExpeditionDuration(state, originCityName, targetCoords, troopQty) {
  const origin = resolveCityCoords(originCityName, state.playerCities, state.mapCities);
  return calcExpeditionTravelSeconds({
    origin,
    target: targetCoords,
    troopQty,
    mapCities: state.mapCities,
    mode: 'attack',
  });
}
