import { getPlayerProvinceNames } from './botProvinceAssignment';
import { findProvinceFeature, resolveCityProvinceName } from '../map/cityProvinceMatch';
import { getOwnProvinceStyle, getProvinceStyle } from '../map/mapUtils';

/** Oyuncu kontrolündeki il adları (shapeName) */
export function buildOwnProvinceNameSet(mapCities, playerCities, provinces = null) {
  const names = new Set(getPlayerProvinceNames(mapCities, playerCities));

  for (const pc of playerCities ?? []) {
    const province = resolveCityProvinceName({ name: pc.name, lat: pc.lat, lng: pc.lng }, playerCities)
      ?? pc.provinceName;
    if (province) names.add(province);
  }

  if (provinces?.features?.length) {
    for (const pc of playerCities ?? []) {
      const feature = findProvinceFeature(
        provinces,
        { name: pc.name, lat: pc.lat, lng: pc.lng, provinceName: pc.provinceName },
        playerCities,
      );
      const shapeName = feature?.properties?.shapeName;
      if (shapeName) names.add(shapeName);
    }
  }

  return names;
}

/** İl poligonu temel stili — önce kendi (yeşil), sonra bot (kırmızı) */
export function resolveProvinceLayerStyle(provinceName, ownNames, botNames) {
  if (provinceName && ownNames?.has(provinceName)) return getOwnProvinceStyle();
  if (provinceName && botNames?.has(provinceName)) return getBotProvinceStyle();
  return getProvinceStyle();
}

/** Bot kontrolündeki il poligon adları (shapeName) — pulse katmanı */
export function buildBotProvinceNameSet(mapCities, playerCities, provinces = null) {
  const set = new Set();

  for (const city of mapCities ?? []) {
    if (city.status !== 'bot') continue;
    const provinceName = resolveCityProvinceName(city, playerCities);
    if (provinceName) set.add(provinceName);
  }

  if (provinces?.features?.length) {
    const playerProvinces = buildOwnProvinceNameSet(mapCities, playerCities, provinces);
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
