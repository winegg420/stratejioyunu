/**
 * Statik regresyon korumaları — CI ve deploy öncesi çalıştırılır.
 * Yeni global gate / admin reload gibi kırılgan kalıpları yakalar.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const failures = [];

function forbid(rel, pattern, message) {
  const src = read(rel);
  if (pattern.test(src)) failures.push({ rel, message });
}

// Admin modu: tam sayfa yenileme kırılgan (snapshot / gate yarışı)
forbid(
  'src/stores/gameStore.js',
  /enableAdminMode:[\s\S]*?window\.location\.reload\(\)/,
  'enableAdminMode must not call window.location.reload()',
);
forbid(
  'src/stores/gameStore.js',
  /disableAdminMode:[\s\S]*?window\.location\.reload\(\)/,
  'disableAdminMode must not call window.location.reload()',
);

// Global gate: admin-log hafif rota listesinde olmalı
const policy = read('src/lib/routeSessionPolicy.js');
if (!policy.includes("'/admin-log'")) {
  failures.push({
    rel: 'src/lib/routeSessionPolicy.js',
    message: "LIGHT_SESSION_ROUTES must include '/admin-log'",
  });
}

const gate = read('src/components/PageSessionGate.jsx');
if (!gate.includes('routeSessionPolicy') && !gate.includes('isLightSessionRoute')) {
  failures.push({
    rel: 'src/components/PageSessionGate.jsx',
    message: 'PageSessionGate must use routeSessionPolicy (light routes)',
  });
}

if (failures.length) {
  console.error('\n=== REGRESSION GUARDS FAILED ===\n');
  for (const f of failures) {
    console.error(`• ${f.rel}: ${f.message}`);
  }
  console.error('\nFix before deploy. See .cursor/rules/regression-safety.mdc\n');
  process.exit(1);
}

console.log('Regression guards OK');
