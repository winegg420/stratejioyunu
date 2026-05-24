/**
 * Statik regresyon korumaları — CI ve deploy öncesi çalıştırılır.
 * Yeni global gate / admin reload gibi kırılgan kalıpları yakalar.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

// tick() eski expeditions snapshot'ını geri yazmasın
forbid(
  'src/stores/gameStore.js',
  /lastTickAt:\s*now,[\s\S]{0,400}?expeditions:\s*state\.expeditions/,
  'tick() must not re-apply stale state.expeditions — use get().expeditions',
);
forbid(
  'src/pages/AdminLog.jsx',
  /fetchAdminLogs\(\s*\d+\s*\)/,
  'fetchAdminLogs(limit) is ambiguous — use fetchAdminLogs(DEFAULT_SERVER_ID, limit)',
);
forbid(
  'src/stores/gameStore.js',
  /fetchAdminLogs\(\s*\d+\s*\)/,
  'fetchAdminLogs(limit) is ambiguous — use fetchAdminLogs(DEFAULT_SERVER_ID, limit)',
);

// React 19 — useGameStore getSnapshot must not allocate new [] / {} fallbacks
const scanDirs = ['src/pages', 'src/components', 'src/map', 'src/hooks'];
for (const dir of scanDirs) {
  const full = join(root, dir);
  if (!statSync(full).isDirectory()) continue;
  for (const name of readdirSync(full)) {
    if (!/\.(jsx?|tsx?)$/.test(name)) continue;
    const relPath = `${dir}/${name}`.replace(/\\/g, '/');
    forbid(relPath, /useGameStore\(\(s\)\s*=>\s*[^\n]*\?\?\s*\[\]/, 'use STORE_EMPTY_ARRAY in useGameStore selectors');
    forbid(relPath, /useGameStore\(\(s\)\s*=>\s*[^\n]*\?\?\s*\{\}/, 'use STORE_EMPTY_OBJECT in useGameStore selectors');
    forbid(
      relPath,
      /useGameStore\(\(s\)\s*=>\s*\n\s*\(s\.[^\n]+\)\.(filter|map|slice|reduce)\(/,
      'do not derive arrays inside useGameStore selectors — use useMemo',
    );
  }
}
forbid(
  'src/stores/resourceStore.js',
  /useGameStore\(\(s\)\s*=>\s*[^\n]*\?\?\s*\[\]/,
  'use STORE_EMPTY_ARRAY in useGameStore selectors',
);

if (failures.length) {
  console.error('\n=== REGRESSION GUARDS FAILED ===\n');
  for (const f of failures) {
    console.error(`• ${f.rel}: ${f.message}`);
  }
  console.error('\nFix before deploy. See .cursor/rules/regression-safety.mdc\n');
  process.exit(1);
}

console.log('Regression guards OK');
