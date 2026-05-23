/** İç içe locale nesnelerini birleştirir (alt anahtarlar korunur). */
export function mergeLocale(base, extra) {
  const out = { ...base };
  for (const key of Object.keys(extra ?? {})) {
    const bv = base?.[key];
    const ev = extra[key];
    if (
      ev
      && typeof ev === 'object'
      && !Array.isArray(ev)
      && bv
      && typeof bv === 'object'
      && !Array.isArray(bv)
    ) {
      out[key] = mergeLocale(bv, ev);
    } else {
      out[key] = ev;
    }
  }
  return out;
}
