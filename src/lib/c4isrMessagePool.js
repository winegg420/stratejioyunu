/**
 * C4ISR alt bant — dönüşümlü durum mesaj havuzu (tekrarlayan tek satır önlenir).
 */
const POOL_KEYS = [
  'scan',
  'radar',
  'logistics',
  'comms',
  'patrol',
  'intel',
  'grid',
  'supply',
  'satlink',
  'command',
];

export function buildC4isrStatusPool(t) {
  return POOL_KEYS.map((key) => ({
    id: `c4isr-pool-${key}`,
    tag: t('terminal.tags.system'),
    text: t(`terminal.pool.${key}`),
  }));
}

/** Dinamik + havuz — en az minCount benzersiz satır */
export function mergeTickerWithPool(dynamicItems, t, minCount = 10) {
  const pool = buildC4isrStatusPool(t);
  const seen = new Set();
  const out = [];

  for (const item of [...(dynamicItems ?? []), ...pool]) {
    const textKey = `${item.tag}|${item.text}`;
    if (seen.has(textKey)) continue;
    seen.add(textKey);
    out.push(item);
    if (out.length >= minCount) break;
  }

  if (out.length < minCount) {
    for (const item of pool) {
      if (out.length >= minCount) break;
      const textKey = `${item.tag}|${item.text}`;
      if (seen.has(textKey)) continue;
      seen.add(textKey);
      out.push({ ...item, id: `${item.id}-fill-${out.length}` });
    }
  }

  return out;
}
