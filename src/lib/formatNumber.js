/** Mobil kaynak çubuğu için kısa sayı formatı: 250K, 1.2M */
export function formatCompactNumber(n) {
  if (n == null || Number.isNaN(n)) return '0';
  const num = Number(n);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${trimTrailingZero(abs / 1_000_000_000)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${trimTrailingZero(abs / 1_000_000)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}${trimTrailingZero(abs / 1_000)}K`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString('tr-TR');
}

function trimTrailingZero(value) {
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

/** K/M/B veya yerel formatlı metni ham sayıya çevirir. */
export function parseCompactNumber(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);

  const raw = String(value).trim().replace(/\s/g, '');
  if (!raw) return 0;

  const compact = raw.match(/^(-?)(\d+(?:[.,]\d+)?)([kmbKMB])?$/);
  if (compact) {
    const sign = compact[1] === '-' ? -1 : 1;
    const num = Number(compact[2].replace(',', '.'));
    if (!Number.isFinite(num)) return 0;
    const suffix = (compact[3] || '').toUpperCase();
    const mult = suffix === 'K' ? 1_000
      : suffix === 'M' ? 1_000_000
        : suffix === 'B' ? 1_000_000_000
          : 1;
    return Math.floor(sign * num * mult);
  }

  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

/** Input alanlarına yazılacak ham sayısal string (150000). */
export function toRawInputNumber(value) {
  const n = parseCompactNumber(value);
  return n > 0 ? String(n) : '';
}
