export function getTroopsAwayFromCity(expeditions, cityId) {
  const away = {};
  for (const exp of expeditions) {
    if (exp.originCityId !== cityId || !exp.troopPayload || exp.troopPayload.spies != null) continue;
    for (const [id, qty] of Object.entries(exp.troopPayload)) {
      if (!qty || id === 'spies') continue;
      away[id] = (away[id] || 0) + qty;
    }
  }
  return away;
}

export function getTroopStock(troop, awayMap = {}) {
  const idle = troop.available ?? 0;
  const away = awayMap[troop.id] || 0;
  const total = idle + away;
  return { total, idle, away };
}

export function formatTroopStockLabel(stock) {
  return `Toplam: ${stock.total.toLocaleString('tr-TR')} | Boşta: ${stock.idle.toLocaleString('tr-TR')}`;
}
