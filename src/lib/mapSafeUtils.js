/** Harita verisi — güvenli sayı/koordinat (render çökmez) */

export function safeNumber(value, fallback = 0) {
  try {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function safeLatLng(lat, lng, fallback = { lat: 39, lng: 35 }) {
  return {
    lat: safeNumber(lat, fallback.lat),
    lng: safeNumber(lng, fallback.lng),
  };
}

export function safeCityRecord(city) {
  try {
    if (!city || typeof city !== 'object') return null;
    const { lat, lng } = safeLatLng(city.lat, city.lng);
    return {
      ...city,
      name: String(city.name ?? '—'),
      lat,
      lng,
      status: city.status ?? 'empty',
    };
  } catch {
    return null;
  }
}

export function safeMapCities(list) {
  try {
    if (!Array.isArray(list)) return [];
    return list.map(safeCityRecord).filter(Boolean);
  } catch {
    return [];
  }
}

export function safeFilterMapCities(cities, predicate) {
  try {
    const base = safeMapCities(cities);
    if (typeof predicate !== 'function') return base;
    return base.filter((c) => {
      try {
        return predicate(c);
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export function safeLatLngToLoc(lat, lng) {
  try {
    const la = safeNumber(lat, 39);
    const ln = safeNumber(lng, 35);
    const x = Math.round(((ln - 26) / 19) * 999);
    const y = Math.round(((42 - la) / 6) * 999);
    return {
      x: Math.max(0, Math.min(999, x)),
      y: Math.max(0, Math.min(999, y)),
    };
  } catch {
    return { x: 0, y: 0 };
  }
}

export function safeRunMapOp(fn, fallback = null) {
  try {
    return fn();
  } catch (err) {
    console.warn('[MAP_SAFE]', err);
    return fallback;
  }
}
