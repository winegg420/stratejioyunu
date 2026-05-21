/** İl kodunu shapeISO / playerCities.province ile eşleştir */
import { normalizeIdeology } from '../lib/ideologySystem';
import { normalizeMapCity, normalizeMapCities } from './botCityUtils';

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
  if (city.status === 'empty' || !city.owner) return 'Boş';
  return city.owner;
}

/** Demo / placeholder harita sahipleri için sabit ideoloji */
export const DEMO_OWNER_IDEOLOGY = {
  KaraKurt: 'nationalist',
  SteelWolf: 'socialist',
  Falcon99: 'technocrat',
};

export function resolveOwnerIdeology(city, playerName, playerIdeology) {
  if (city.isOwn || city.status === 'own' || city.owner === playerName) {
    return normalizeIdeology(playerIdeology);
  }
  if (city.ownerIdeology) return normalizeIdeology(city.ownerIdeology);
  if (city.owner && DEMO_OWNER_IDEOLOGY[city.owner]) {
    return DEMO_OWNER_IDEOLOGY[city.owner];
  }
  if (city.status === 'bot') return 'nationalist';
  return null;
}

export function syncMapCitiesForPlayer(mapCities, playerCities, playerName, playerIdeology = null) {
  const ownNames = new Set(playerCities.map((c) => c.name));
  const ideology = normalizeIdeology(playerIdeology);
  return normalizeMapCities(mapCities).map((c) => {
    if (ownNames.has(c.name) || c.status === 'own') {
      return {
        ...c,
        owner: playerName,
        status: 'own',
        ownerIdeology: ideology,
        isOwn: true,
      };
    }
    if (c.status === 'bot') {
      return { ...c, owner: null, ownerIdeology: 'nationalist' };
    }
    if (c.status === 'empty' || !c.owner) {
      return { ...c, owner: null, ownerIdeology: null };
    }
    const ownerIdeology = DEMO_OWNER_IDEOLOGY[c.owner] ?? c.ownerIdeology ?? null;
    return { ...c, ownerIdeology: normalizeIdeology(ownerIdeology) };
  });
}

export { normalizeMapCity, normalizeMapCities };
