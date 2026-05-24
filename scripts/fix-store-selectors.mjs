import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(name)) files.push(p);
  }
}
walk(root);

function ensureImport(src, symbol) {
  if (src.includes(symbol)) return src;
  const rel = /from '\.\/gameStore'/.test(src)
    ? "./gameStore'"
    : "../stores/gameStore'";
  const path = rel.startsWith('.') ? './gameStore' : '../stores/gameStore';
  const re = new RegExp(`import \\{([^}]*)\\} from ['"]${path.replace('.', '\\.')}['"]`);
  if (re.test(src)) {
    return src.replace(re, (m, inner) => {
      const parts = inner.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.includes(symbol)) return m;
      parts.push(symbol);
      return `import { ${parts.join(', ')} } from '${path}'`;
    });
  }
  return `import { ${symbol}, useGameStore } from '${path}';\n${src.replace(
    /import \{ useGameStore \} from ['"][^'"]+['"];?\n?/,
    '',
  )}`;
}

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const orig = src;

  src = src.replace(
    /useGameStore\(\((s)\)\s*=>\s*([^;\n]+?)\?\?\s*\[\]/g,
    'useGameStore(($1) => $2?? STORE_EMPTY_ARRAY',
  );
  src = src.replace(
    /useGameStore\(\((s)\)\s*=>\s*\n\s*([^)]*?)\?\?\s*\[\]/g,
    'useGameStore(($1) =>\n    $2?? STORE_EMPTY_ARRAY',
  );
  src = src.replace(
    /useGameStore\(\((s)\)\s*=>\s*(s\.openMarketPrices)\s*\?\?\s*\{\}/g,
    'useGameStore(($1) => $2 ?? STORE_EMPTY_OBJECT',
  );

  if (src !== orig) {
    if (src.includes('STORE_EMPTY_ARRAY')) src = ensureImport(src, 'STORE_EMPTY_ARRAY');
    if (src.includes('STORE_EMPTY_OBJECT')) src = ensureImport(src, 'STORE_EMPTY_OBJECT');
    writeFileSync(file, src);
    changed++;
    console.log('fixed:', file.replace(root, '').replace(/^[/\\]/, ''));
  }
}
console.log('total', changed);
