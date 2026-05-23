/**
 * TR ↔ EN locale yapı senkronu.
 * Yeni anahtarlar önce extra/tr.js'e eklenir; `npm run i18n:sync` ile extra/en.js güncellenir.
 */

export function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

export function collectStringPaths(obj, prefix = '') {
  const paths = [];
  for (const key of Object.keys(obj ?? {})) {
    const p = prefix ? `${prefix}.${key}` : key;
    const v = obj[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      paths.push(...collectStringPaths(v, p));
    } else if (typeof v === 'string') {
      paths.push(p);
    }
  }
  return paths;
}

/** TR'de olup EN'de eksik string yolları */
export function findMissingEnPaths(trLocale, enLocale) {
  const trPaths = collectStringPaths(trLocale);
  return trPaths.filter((p) => {
    const enVal = getByPath(enLocale, p);
    return enVal == null || enVal === '';
  });
}

/** İç içe nesneye dot-path ile string yazar */
export function setByPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}
