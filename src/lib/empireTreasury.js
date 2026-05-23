function parseHourlyRate(rateStr) {
  const match = rateStr?.match(/\+(\d+)/);
  return match ? Number(match[1]) : 0;
}

/** İmparatorluk ortak dijital bütçe havuzu (tüm şehirlerdeki money toplamı). */
export function getUserBalance(cities = {}) {
  return getEmpireMoneyTotal(cities);
}

export function getEmpireMoneyTotal(cities = {}) {
  let total = 0;
  for (const city of Object.values(cities ?? {})) {
    const money = city?.resources?.find((r) => r.id === 'money');
    total += money?.current ?? 0;
  }
  return Math.floor(total);
}

export function getEmpireMoneyHourlyTotal(cities = {}) {
  let total = 0;
  for (const city of Object.values(cities ?? {})) {
    const money = city?.resources?.find((r) => r.id === 'money');
    total += parseHourlyRate(money?.rate);
  }
  return total;
}

/**
 * Ortak bütçeden düş — önce tercih edilen şehir, sonra diğerleri.
 * @returns {{ cities: object, paid: number }}
 */
export function deductEmpireMoney(cities, amount, preferredCityId = null) {
  let remaining = Math.max(0, Math.floor(amount));
  if (remaining <= 0) return { cities: { ...cities }, paid: 0 };

  const order = [
    ...(preferredCityId ? [preferredCityId] : []),
    ...Object.keys(cities).filter((id) => id !== preferredCityId),
  ];

  const next = { ...cities };
  for (const cityId of order) {
    if (remaining <= 0) break;
    const city = next[cityId];
    if (!city?.resources) continue;
    next[cityId] = {
      ...city,
      resources: city.resources.map((r) => {
        if (r.id !== 'money') return r;
        const take = Math.min(remaining, r.current);
        remaining -= take;
        return { ...r, current: Math.max(0, r.current - take) };
      }),
    };
  }

  const paid = amount - remaining;
  return { cities: next, paid };
}

export function canAffordEmpireMoney(cities, amount) {
  return getEmpireMoneyTotal(cities) >= Math.floor(amount);
}

/** Ortak bütçeye ekle — önce tercih edilen şehir. */
export function creditEmpireMoney(cities, amount, preferredCityId = null) {
  let remaining = Math.max(0, Math.floor(amount));
  if (remaining <= 0) return { cities: { ...cities }, credited: 0 };

  const order = [
    ...(preferredCityId ? [preferredCityId] : []),
    ...Object.keys(cities).filter((id) => id !== preferredCityId),
  ];

  const next = { ...cities };
  for (const cityId of order) {
    if (remaining <= 0) break;
    const city = next[cityId];
    if (!city?.resources) continue;
    next[cityId] = {
      ...city,
      resources: city.resources.map((r) => {
        if (r.id !== 'money') return r;
        const cap = r.max != null ? r.max : Number.MAX_SAFE_INTEGER;
        const add = Math.min(remaining, cap - r.current);
        remaining -= add;
        return { ...r, current: r.current + add };
      }),
    };
  }

  return { cities: next, credited: amount - remaining };
}

/**
 * ResourceBar için money satırını imparatorluk özeti ile zenginleştir.
 */
export function enrichResourcesWithEmpireTreasury(resources, allCities) {
  const total = getEmpireMoneyTotal(allCities);
  const hourly = getEmpireMoneyHourlyTotal(allCities);
  return (resources ?? []).map((r) => {
    if (r.id !== 'money') return r;
    return {
      ...r,
      current: total,
      empireShared: true,
      empireHourly: hourly,
      rate: hourly > 0 ? `+${hourly}/sa` : r.rate,
      _localCurrent: r.current,
    };
  });
}
