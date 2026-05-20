/** İl kodunu shapeISO / playerCities.province ile eşleştir */
export function normalizeProvinceCode(code) {
  if (code == null || code === '') return '';
  const digits = String(code).replace(/\D/g, '');
  if (!digits) return String(code).trim();
  return digits.length <= 2 ? digits.padStart(2, '0') : digits.slice(-2);
}

export function getCityOwnerLabel(city, playerName) {
  if (city.isOwn || city.status === 'own') return playerName;
  if (city.status === 'bot') return city.owner || 'Bot';
  if (city.status === 'empty' || !city.owner) return 'Boş';
  return city.owner;
}

export function syncMapCitiesForPlayer(mapCities, playerCities, playerName) {
  const ownNames = new Set(playerCities.map((c) => c.name));
  return mapCities.map((c) => {
    if (ownNames.has(c.name) || c.status === 'own') {
      return { ...c, owner: playerName, status: 'own' };
    }
    if (c.status === 'bot') {
      return { ...c, owner: c.owner || 'Bot' };
    }
    if (c.status === 'empty' || !c.owner) {
      return { ...c, owner: null };
    }
    return { ...c };
  });
}
