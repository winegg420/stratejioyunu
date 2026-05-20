import { formatCompactNumber } from './formatNumber';
import { ratePerSecond } from './gameUtils';

/** Kaynak rate string'inden saatlik üretim (sayı). */
export function getHourlyAmount(resource) {
  if (!resource?.rate || resource.productionFrozen) return 0;
  const perSec = ratePerSecond(resource.rate);
  if (perSec > 0) return perSec * 3600;
  const match = String(resource.rate).match(/\+([\d.,]+)/);
  if (!match) return 0;
  return Number(match[1].replace(/\./g, '').replace(',', '.')) || 0;
}

/** Üst bar: +1.2K/saat veya enerji +300 E/saat */
export function formatHourlyProduction(resource) {
  const hourly = getHourlyAmount(resource);
  if (hourly <= 0) return null;
  const compact = formatCompactNumber(hourly);
  if (resource.id === 'energy') {
    return `+${compact} E/saat`;
  }
  return `+${compact}/saat`;
}
