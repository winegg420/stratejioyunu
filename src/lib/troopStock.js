/** Stable empty map — React 19 requires cached getSnapshot references. */
export const EMPTY_AWAY_MAP = Object.freeze({});

let awayCacheKey = '';
let awayCacheResult = EMPTY_AWAY_MAP;

function buildAwayCacheKey(expeditions, cityId) {
  if (!cityId || !expeditions?.length) return `${cityId}:empty`;
  const parts = [];
  for (const exp of expeditions) {
    if (exp.originCityId !== cityId || !exp.troopPayload || exp.troopPayload.spies != null) continue;
    parts.push(`${exp.id}:${JSON.stringify(exp.troopPayload)}`);
  }
  return `${cityId}:${parts.join('|')}`;
}

export function getTroopsAwayFromCity(expeditions, cityId) {
  const key = buildAwayCacheKey(expeditions, cityId);
  if (key === awayCacheKey) return awayCacheResult;

  const away = {};
  for (const exp of expeditions) {
    if (exp.originCityId !== cityId || !exp.troopPayload || exp.troopPayload.spies != null) continue;
    for (const [id, qty] of Object.entries(exp.troopPayload)) {
      if (!qty || id === 'spies') continue;
      away[id] = (away[id] || 0) + qty;
    }
  }

  awayCacheKey = key;
  awayCacheResult = Object.keys(away).length === 0 ? EMPTY_AWAY_MAP : away;
  return awayCacheResult;
}

export function getTroopStock(troop, awayMap = EMPTY_AWAY_MAP) {
  const idle = troop.available ?? 0;
  const away = awayMap[troop.id] || 0;
  const total = idle + away;
  return { total, idle, away };
}

export function formatTroopStockLabel(stock) {
  return `Toplam: ${stock.total.toLocaleString('tr-TR')} | Boşta: ${stock.idle.toLocaleString('tr-TR')}`;
}
