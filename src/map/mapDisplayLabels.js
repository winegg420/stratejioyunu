/** Harita modal ve etiket metinleri */

export const RESOURCE_UNKNOWN_LABEL = '[ VERİ YOK — İSTİHBARAT GEREKLİ ]';
export const OWNER_UNCLAIMED_LABEL = 'Fethedilmemiş Bölge';
export const BOT_MANAGEMENT_LABEL = '[ OTOMATİK YÖNETİM ]';

export function formatMapOwnerDisplay(city, playerName) {
  if (!city) return OWNER_UNCLAIMED_LABEL;
  if (city.status === 'bot') return BOT_MANAGEMENT_LABEL;
  if (city.isOwn || city.status === 'own') return playerName || 'Siz';
  if (city.status === 'empty' || !city.owner) return OWNER_UNCLAIMED_LABEL;
  return city.owner;
}

export function formatMapStatusBadge(city) {
  if (!city) return '';
  if (city.status === 'bot') return BOT_MANAGEMENT_LABEL;
  if (city.status === 'own') return 'Kendi üssünüz';
  if (city.status === 'empty') return OWNER_UNCLAIMED_LABEL;
  if (city.status === 'enemy') return 'Düşman üssü';
  return city.status ?? '';
}

export function formatResourceValue(resource, city) {
  if (resource?.displayValue) return resource.displayValue;
  if (city?.status === 'bot' || city?.status === 'empty') {
    return RESOURCE_UNKNOWN_LABEL;
  }
  if (typeof resource?.current === 'number') {
    const cur = Math.floor(resource.current).toLocaleString('tr-TR');
    const max = resource.max != null
      ? ` / ${Math.floor(resource.max).toLocaleString('tr-TR')}`
      : '';
    return `${cur}${max}`;
  }
  return RESOURCE_UNKNOWN_LABEL;
}
