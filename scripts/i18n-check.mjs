import tr from '../src/i18n/locales/tr.js';
import en from '../src/i18n/locales/en.js';

function keys(obj, prefix = '') {
  const out = [];
  for (const [key, val] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      out.push(...keys(val, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

const trKeys = keys(tr);
const enKeys = new Set(keys(en));
const missingInEn = trKeys.filter((k) => !enKeys.has(k));
const missingInTr = [...enKeys].filter((k) => !trKeys.includes(k));

console.log(`TR keys: ${trKeys.length}`);
console.log(`EN keys: ${enKeys.size}`);
console.log(`Missing in EN: ${missingInEn.length}`);
if (missingInEn.length) console.log(missingInEn.join('\n'));
console.log(`Missing in TR: ${missingInTr.length}`);
if (missingInTr.length) console.log(missingInTr.join('\n'));
process.exit(missingInEn.length || missingInTr.length ? 1 : 0);
