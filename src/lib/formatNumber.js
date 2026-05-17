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
