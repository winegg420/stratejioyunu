import {
  getAiCenterEnergyDemandHourly,
  getAiCenterLevel,
  isAiCenterSabotaged,
} from './aiCenterEngine';
import { ratePerSecond } from './gameUtils';

/** Saatlik üretim miktarı — tam sayı (K/M kısaltması yok). */
export function formatHourlyAmount(n) {
  return Number(n).toLocaleString('tr-TR');
}

/** Kaynak rate string'inden saatlik üretim (sayı). */
export function getHourlyAmount(resource) {
  if (!resource?.rate || resource.productionFrozen) return 0;
  const perSec = ratePerSecond(resource.rate);
  if (perSec > 0) return perSec * 3600;
  const match = String(resource.rate).match(/\+([\d.,]+)/);
  if (!match) return 0;
  return Number(match[1].replace(/\./g, '').replace(',', '.')) || 0;
}

/** YZ Merkezi — tick enerji talebi (saatlik). */
export function getEnergyDrainHourly(city) {
  if (!city) return 0;
  const level = getAiCenterLevel(city);
  if (level < 1 || isAiCenterSabotaged(city)) return 0;
  return getAiCenterEnergyDemandHourly(level);
}

/** Enerji — üretim − YZ talebi (üst barda net yön). */
export function getEnergyNetHourly(resource, city) {
  if (resource?.id !== 'energy') return getHourlyAmount(resource);
  return getHourlyAmount(resource) - getEnergyDrainHourly(city);
}

/** Üst bar: ikon + kaynak adı + üretim (+1.234/saat) */
export function formatHourlyProduction(resource) {
  const hourly = getHourlyAmount(resource);
  if (hourly <= 0) return null;
  const formatted = formatHourlyAmount(hourly);
  const icon = resource.icon ? `${resource.icon} ` : '';
  const label = resource.label ?? resource.id ?? '';
  if (resource.id === 'energy') {
    return `${icon}${label} +${formatted} E/saat`;
  }
  return `${icon}${label} +${formatted}/saat`;
}
