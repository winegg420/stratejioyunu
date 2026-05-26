import { WORLD_ROLES } from '../data/worldCitiesCatalog';
import { getPlayerProvinceNames } from './botProvinceAssignment';
import { findProvinceFeature, resolveCityProvinceName } from '../map/cityProvinceMatch';
import {
  getForeignPlayerProvinceStyle,
  getOwnProvinceStyle,
  getProvinceStyle,
  isForeignPlayerCity,
  WORLD_ROLE_COLORS,
} from '../map/mapUtils';
import { getCurrentPlayerName } from './playerIdentity';

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

/** Ülke adı → poligon stili (oyuncu / bot rolü) */
export function buildProvinceStyleContext(mapCities, playerCities, playerName = getCurrentPlayerName()) {
  const foreignByProvince = new Map();
  const botRoleByProvince = new Map();

  for (const city of mapCities ?? []) {
    const provinceName = resolveCityProvinceName(city, playerCities);
    if (!provinceName) continue;

    if (isForeignPlayerCity(city, playerName)) {
      foreignByProvince.set(provinceName, getForeignPlayerProvinceStyle(city.owner));
      continue;
    }

    if (city.status === 'bot') {
      botRoleByProvince.set(
        provinceName,
        city.worldRole ?? WORLD_ROLES.BOT_CAPITAL,
      );
    }
  }

  return { foreignByProvince, botRoleByProvince };
}

export function getBotProvinceStyleByRole(worldRole = WORLD_ROLES.BOT_CAPITAL) {
  const hex = WORLD_ROLE_COLORS[worldRole] ?? '#ef4444';
  return {
    fillColor: hex,
    fillOpacity: 0.14,
    color: hex,
    weight: 1.45,
    lineJoin: 'round',
    lineCap: 'round',
    opacity: 0.9,
  };
}

/** İl poligonu temel stili — kendi (yeşil) → yabancı oyuncu → bot rolü */
export function resolveProvinceLayerStyle(
  provinceName,
  ownNames,
  botNames,
  styleContext = null,
) {
  if (provinceName && ownNames?.has(provinceName)) return getOwnProvinceStyle();

  const ctx = styleContext ?? { foreignByProvince: new Map(), botRoleByProvince: new Map() };

  if (provinceName && ctx.foreignByProvince?.has(provinceName)) {
    return ctx.foreignByProvince.get(provinceName);
  }

  if (provinceName && botNames?.has(provinceName)) {
    const role = ctx.botRoleByProvince?.get(provinceName) ?? WORLD_ROLES.BOT_CAPITAL;
    return getBotProvinceStyleByRole(role);
  }

  return getProvinceStyle();
}

/** Bot kontrolündeki il poligon adları (shapeName) */
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

/** @deprecated — getBotProvinceStyleByRole kullanın */
export function getBotProvinceStyle() {
  return getBotProvinceStyleByRole(WORLD_ROLES.BOT_CAPITAL);
}

/** @deprecated */
export function getBotProvincePulseStyle(_phase = 0) {
  return getBotProvinceStyle();
}
