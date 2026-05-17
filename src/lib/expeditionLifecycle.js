import { createQueueTiming, remainingFromEndsAt } from './gameUtils';

const COORD_EPS = 0.02;

export function coordsNear(aLat, aLng, bLat, bLng, eps = COORD_EPS) {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return false;
  return Math.abs(aLat - bLat) < eps && Math.abs(aLng - bLng) < eps;
}

/** Giden sefer hedefi harita şehriyle eşleşiyor mu? */
export function expeditionTargetsMapCity(exp, city) {
  if (!exp || !city || exp.direction !== 'outgoing') return false;
  if (exp.target === city.name) return true;
  if (exp.sourceMapCityName && exp.sourceMapCityName === city.name) return true;
  return coordsNear(exp.targetLat, exp.targetLng, city.lat, city.lng);
}

export function isExpeditionFromPlayer(exp, playerCityIds, playerCityNames) {
  if (!exp) return false;
  if (exp.originCityId && playerCityIds.has(exp.originCityId)) return true;
  if (exp.originCityName && playerCityNames.has(exp.originCityName)) return true;
  return false;
}

/** Orduyu güvenli geri dönüş seferine çevirir (saf fonksiyon). */
export function recallExpeditionForReturn(exp, now = Date.now()) {
  if (!exp || exp.direction === 'returning' || exp.recalled) return exp;

  const remaining = remainingFromEndsAt(exp.endsAt, now);
  const elapsedSeconds = exp.startedAt
    ? Math.max(1, Math.ceil((now - exp.startedAt) / 1000))
    : Math.max(1, (exp.durationSeconds || remaining || 1) - remaining);
  const travelSeconds = remaining > 0 ? elapsedSeconds : 1;
  const returnTiming = createQueueTiming(travelSeconds);

  return {
    ...exp,
    direction: 'returning',
    type: 'Geri Dönüş',
    originalTarget: exp.originalTarget ?? exp.target,
    target: exp.originCityName ?? exp.originCityId ?? 'Üs',
    recalled: true,
    skipCombat: true,
    ...returnTiming,
  };
}

export function recallExpeditionsTargetingCity(expeditions, city, now = Date.now()) {
  return (expeditions ?? []).map((exp) => {
    if (!expeditionTargetsMapCity(exp, city) || exp.recalled) return exp;
    return recallExpeditionForReturn(exp, now);
  });
}

/** Sefer hedefi / kaynağı olarak şehri referans alıyor mu? */
export function expeditionReferencesCity(exp, city) {
  if (!exp || !city) return false;
  if (exp.target === city.name) return true;
  if (exp.originalTarget === city.name) return true;
  if (exp.sourceMapCityName === city.name) return true;
  return expeditionTargetsMapCity(exp, city);
}

/** Temizlik sonrası hedefe giden gidiş seferlerini kaldır. */
export function stripOutgoingExpeditionsToCity(expeditions, city) {
  return (expeditions ?? []).filter((exp) => {
    if (exp.direction === 'returning' || exp.recalled) return true;
    return !expeditionTargetsMapCity(exp, city);
  });
}

/** Geri dönüşte hayalet hedefe bağlı seferleri hızlandır (bir sonraki tick'te tamamlanır). */
export function fastForwardReturnsFromCleansedCity(expeditions, city, now = Date.now()) {
  return (expeditions ?? []).map((exp) => {
    const refsGhost =
      (exp.direction === 'returning' || exp.recalled)
      && (exp.originalTarget === city.name || expeditionTargetsMapCity(exp, city));
    if (!refsGhost) return exp;
    const duration = Math.max(1, exp.durationSeconds ?? 1);
    return {
      ...exp,
      startedAt: now - duration * 1000,
      endsAt: now + 400,
    };
  });
}

/**
 * VIP atma: oyuncunun tüm aktif seferlerini iptal et;
 * oyuncu şehrine giden yabancı orduları üsse geri çağır.
 */
export function purgeExpeditionsOnVipAscension(state, playerName, now = Date.now()) {
  const playerCityIds = new Set((state.playerCities ?? []).map((c) => c.id));
  const playerCityNames = new Set((state.playerCities ?? []).map((c) => c.name));

  const playerMapTargets = (state.mapCities ?? []).filter(
    (c) => c.owner === playerName || playerCityNames.has(c.name),
  );

  let cancelledCount = 0;
  let recalledCount = 0;
  const expeditions = [];

  for (const exp of state.expeditions ?? []) {
    if (isExpeditionFromPlayer(exp, playerCityIds, playerCityNames)) {
      cancelledCount += 1;
      continue;
    }

    const targetsPlayerCity = playerMapTargets.some((c) => expeditionTargetsMapCity(exp, c));
    if (targetsPlayerCity && exp.direction === 'outgoing' && !exp.recalled) {
      expeditions.push(recallExpeditionForReturn(exp, now));
      recalledCount += 1;
      continue;
    }

    expeditions.push(exp);
  }

  const intelOperations = (state.intelOperations ?? []).filter((op) => {
    if (op.originCityId && playerCityIds.has(op.originCityId)) return false;
    if (op.target && playerCityNames.has(op.target)) return false;
    return true;
  });

  const incomingAttacks = (state.incomingAttacks ?? []).filter(
    (a) => !playerCityIds.has(a.targetCityId),
  );

  return {
    expeditions,
    intelOperations,
    incomingAttacks,
    meydanBattle: null,
    cancelledCount,
    recalledCount,
  };
}
