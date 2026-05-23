import { createCityState } from '../data/gameInit';
import { genId } from './gameUtils';
import { getCurrentPlayerName } from './playerIdentity';
import { liberateMapCity } from './serverCleansing';
import { getVipProductionMultiplier } from './vipPrestige';

function slugCityId(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || genId('city');
}

/** VIP atma sonrası tek şehirli yeni başlangıç durumu. */
export function buildPostAscensionGamePatch(state, playerMeta, playerName = getCurrentPlayerName()) {
  const mapCities = (state.mapCities ?? []).map((c) => {
    if (c.owner === playerName || c.status === 'own') {
      return liberateMapCity(c);
    }
    return c;
  });

  const spawnPlot =
    mapCities.find((c) => c.status === 'empty' && c.lat != null)
    ?? mapCities.find((c) => c.status === 'empty')
    ?? mapCities[0];

  const cityName = spawnPlot?.name ? `${spawnPlot.name} Üssü` : 'Yeni Üs';
  let cityId = slugCityId(cityName);
  if (state.cities?.[cityId]) cityId = genId('city');

  const vipTier = playerMeta.vipTier ?? 0;
  const cityState = createCityState({ vipProductionMultiplier: getVipProductionMultiplier(vipTier) });

  const playerCity = {
    id: cityId,
    name: cityName,
    province: spawnPlot?.province ?? '—',
    provinceName: spawnPlot?.provinceName,
    type: spawnPlot?.type ? `${spawnPlot.type} Şehri` : 'Kıyı Şehri',
    lat: spawnPlot?.lat,
    lng: spawnPlot?.lng,
  };

  const mapCitiesWithHome = mapCities.map((c) => {
    const isSpawn =
      spawnPlot
      && c.lat === spawnPlot.lat
      && c.lng === spawnPlot.lng;
    if (!isSpawn) return c;
    return {
      ...c,
      name: cityName,
      status: 'own',
      owner: playerName,
      population: 1200,
      rank: 'Acemi Komutan',
      alliance: null,
    };
  });

  return {
    activeCityId: cityId,
    playerCities: [playerCity],
    cities: { [cityId]: cityState },
    mapCities: mapCitiesWithHome,
    mapFocusRequest: null,
    lastViewedLocation: null,
    mapTargetPickRequest: null,
    mapTargetPickResult: null,
    flashes: {},
    budgetSpendFloats: [],
    navBadges: { expeditions: false, reports: false },
    pastExpeditions: [],
  };
}
