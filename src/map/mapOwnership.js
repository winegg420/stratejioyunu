/** İl kodunu shapeISO / playerCities.province ile eşleştir */
import {
  DEMO_OWNER_IDEOLOGY,
  ideologyForOwner,
  resolveMapCityOwnerIdeology,
} from '../lib/mapIdeologyDistribution';
import { normalizeIdeology } from '../lib/ideologySystem';
import { normalizeMapCity, normalizeMapCities } from './botCityUtils';

export { DEMO_OWNER_IDEOLOGY };

export function normalizeProvinceCode(code) {
  if (code == null || code === '') return '';
  const digits = String(code).replace(/\D/g, '');
  if (!digits) return String(code).trim();
  return digits.length <= 2 ? digits.padStart(2, '0') : digits.slice(-2);
}

/** GeoJSON shapeISO (TR-35) ile oyuncu plaka kodunu (35) karşılaştır */
export function provinceCodesMatch(a, b) {
  const left = normalizeProvinceCode(a);
  const right = normalizeProvinceCode(b);
  if (!left || !right) return false;
  return left === right;
}

export function getCityOwnerLabel(city, playerName) {
  if (city.isOwn || city.status === 'own') return playerName;
  if (city.status === 'bot') return null;
  if (city.status === 'empty' || !city.owner) return null;
  return city.owner;
}

export function resolveOwnerIdeology(city, playerName, playerIdeology) {
  if (city.isOwn || city.status === 'own' || city.owner === playerName) {
    return normalizeIdeology(playerIdeology);
  }
  return resolveMapCityOwnerIdeology(city);
}

export function syncMapCitiesForPlayer(mapCities, playerCities, playerName, playerIdeology = null) {
  const ownNames = new Set(
    (Array.isArray(playerCities) ? playerCities : []).map((c) => c.name),
  );
  const ideology = normalizeIdeology(playerIdeology);
  return normalizeMapCities(mapCities).map((c) => {
    if (ownNames.has(c.name)) {
      return {
        ...c,
        owner: playerName,
        status: 'own',
        ownerIdeology: ideology,
        isOwn: true,
      };
    }
    if (c.status === 'bot') {
      return {
        ...c,
        owner: null,
        ownerIdeology: resolveMapCityOwnerIdeology(c),
      };
    }
    if (c.status === 'empty' || !c.owner) {
      return {
        ...c,
        owner: null,
        ownerIdeology: resolveMapCityOwnerIdeology(c),
      };
    }
    const ownerIdeology = resolveMapCityOwnerIdeology(c)
      ?? ideologyForOwner(c.owner, { lat: c.lat, lng: c.lng });
    return { ...c, ownerIdeology: normalizeIdeology(ownerIdeology) };
  });
}

export { normalizeMapCity, normalizeMapCities };
