/**
 * Algoritmik istihbarat takip (watchlist) — casusluk + YZ üstünlüğü, ajan maliyeti.
 */
import { genId } from './gameUtils';
import { getSpyTechnologyLevel } from '../utils/spyEngine';
import { getCyberOpsLevel } from './cyberOps';
import {
  getAiCenterLevel,
  isAiCenterOperational,
  resolveDefenderAiLevel,
} from './aiCenterEngine';
import { resolveDefenderCyberOpsLevel } from '../utils/spyEngine';
import { generateDefenderBuildings } from '../utils/spyEngine';

export const WATCHLIST_AGENT_COST = 2;
export const MAX_WATCHLIST_TARGETS = 6;

export function calcAttackerIntelPower(city, researches = []) {
  const spy = getSpyTechnologyLevel({
    researches,
    buildings: city?.buildings ?? [],
  });
  const ai = isAiCenterOperational(city) ? getAiCenterLevel(city) : 0;
  return spy + ai;
}

export function calcDefenderIntelDefense({ mapCity, defenderCity } = {}) {
  const cyber = resolveDefenderCyberOpsLevel({ mapCity, defenderCity });
  const ai = resolveDefenderAiLevel({ mapCity, defenderCity });
  return cyber + ai;
}

export function canAddToWatchlist({
  attackerCity,
  researches,
  mapCity,
  defenderCity,
  targetPlayerName,
  currentPlayerName,
  idleAgents,
  watchlist = [],
}) {
  if (!targetPlayerName || targetPlayerName === currentPlayerName) {
    return { ok: false, reason: 'Geçersiz hedef' };
  }
  if (watchlist.some((w) => w.targetPlayer === targetPlayerName)) {
    return { ok: false, reason: 'Zaten istihbarat ağında' };
  }
  if (watchlist.length >= MAX_WATCHLIST_TARGETS) {
    return { ok: false, reason: `En fazla ${MAX_WATCHLIST_TARGETS} hedef izlenebilir` };
  }
  if ((idleAgents ?? 0) < WATCHLIST_AGENT_COST) {
    return { ok: false, reason: `${WATCHLIST_AGENT_COST} boşta ajan gerekli` };
  }

  const atk = calcAttackerIntelPower(attackerCity, researches);
  const def = calcDefenderIntelDefense({ mapCity, defenderCity });
  if (atk <= def) {
    return {
      ok: false,
      reason: `İstihbarat yetersiz (Siz: ${atk} · Hedef savunma: ${def}). Casusluk + YZ seviyeniz hedefin siber+YZ gücünden yüksek olmalı.`,
      attackerPower: atk,
      defenderPower: def,
    };
  }

  return { ok: true, attackerPower: atk, defenderPower: def };
}

export function createWatchlistEntry(targetPlayerName, mapCityName) {
  return {
    id: genId('watch'),
    targetPlayer: targetPlayerName,
    primaryCity: mapCityName ?? null,
    addedAt: Date.now(),
  };
}

export function pruneIntelFeed(feed = [], maxAgeMs = 48 * 3600000, maxItems = 24) {
  const now = Date.now();
  return feed
    .filter((e) => now - (e.at ?? 0) < maxAgeMs)
    .slice(0, maxItems);
}

export function buildIntelFeedEntry({
  targetPlayer,
  originCity,
  targetCity,
  mode,
  type,
}) {
  return {
    id: genId('intel'),
    at: Date.now(),
    targetPlayer,
    originCity,
    targetCity,
    mode,
    type,
    text: `[ İSTİHBARAT ] ${targetPlayer}: ${type} — ${originCity ?? '?'} → ${targetCity ?? '?'}`,
  };
}

export function detectWatchedExpedition(watchlist, expedition, mapCities, playerName) {
  if (!expedition || expedition.player === playerName) return null;
  const watched = watchlist.find((w) => w.targetPlayer === expedition.player);
  if (!watched) return null;
  return buildIntelFeedEntry({
    targetPlayer: expedition.player,
    originCity: expedition.originCityName,
    targetCity: expedition.target,
    mode: expedition.mode,
    type: expedition.type,
  });
}

/** Harita paneli — bot/düşman şehir savunma özeti */
export function resolveWatchTargetContext(mapCity) {
  const buildings = generateDefenderBuildings(mapCity);
  return {
    mapCity,
    defenderCity: { buildings },
  };
}
