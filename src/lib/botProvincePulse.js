import { getPlayerProvinceNames } from './botProvinceAssignment';
import { resolveCityProvinceName } from '../map/cityProvinceMatch';

/** Bot kontrolündeki il poligon adları (shapeName) — pulse katmanı */
export function buildBotProvinceNameSet(mapCities, playerCities, provinces = null) {
  const set = new Set();

  for (const city of mapCities ?? []) {
    if (city.status !== 'bot') continue;
    const provinceName = resolveCityProvinceName(city, playerCities);
    if (provinceName) set.add(provinceName);
  }

  if (provinces?.features?.length) {
    const playerProvinces = getPlayerProvinceNames(mapCities, playerCities);
    for (const feature of provinces.features) {
      const shapeName = feature.properties?.shapeName;
      if (!shapeName || playerProvinces.has(shapeName)) continue;
      if (set.has(shapeName)) continue;

      const occupant = (mapCities ?? []).find((c) => {
        const p = resolveCityProvinceName(c, playerCities);
        return p === shapeName;
      });

      if (!occupant || occupant.status === 'bot' || occupant.status === 'empty') {
        if (occupant?.status !== 'enemy') set.add(shapeName);
      }
    }
  }

  return set;
}

/** Bot kontrolündeki iller — sabit kırmızı sınır (animasyon yok) */
export function getBotProvinceStyle() {
  return {
    fillColor: '#1a0808',
    fillOpacity: 0.12,
    color: 'rgba(239, 68, 68, 0.88)',
    weight: 1.5,
    lineJoin: 'round',
    lineCap: 'round',
    opacity: 0.88,
  };
}

/** @deprecated Nabız kaldırıldı — sabit kırmızı döner */
export function getBotProvincePulseStyle(_phase = 0) {
  return getBotProvinceStyle();
}
