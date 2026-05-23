#!/usr/bin/env node
/**
 * extra/tr.js ile extra/en.js anahtar eşleşmesini doğrular.
 * Yeni metin eklerken önce extra/tr.js, ardından aynı yapıda extra/en.js güncellenmelidir.
 */
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { findMissingEnPaths } from '../src/i18n/localeSync.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const trExtra = (await import(pathToFileURL(join(root, 'src/i18n/extra/tr.js')).href)).default;
const enExtra = (await import(pathToFileURL(join(root, 'src/i18n/extra/en.js')).href)).default;

const missingInEn = findMissingEnPaths(trExtra, enExtra);
const missingInTr = findMissingEnPaths(enExtra, trExtra);

if (missingInEn.length === 0 && missingInTr.length === 0) {
  console.log('i18n: extra/tr ↔ extra/en senkron.');
  process.exit(0);
}

if (missingInEn.length) {
  console.error('\nEN eksik (extra/en.js):\n', missingInEn.join('\n '));
}
if (missingInTr.length) {
  console.error('\nTR eksik (extra/tr.js):\n', missingInTr.join('\n '));
}
process.exit(1);
