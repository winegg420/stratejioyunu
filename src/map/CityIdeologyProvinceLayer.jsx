import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import {
  getIdeologyTerritoryStyle,
  isNaturalAlly,
  resolveCityIdeology,
} from '../lib/ideologySystem';
import { normalizeMapCity } from './botCityUtils';
import { findProvinceFeature } from './cityProvinceMatch';

export default function CityIdeologyProvinceLayer({
  provinces,
  mapCities,
  playerCities,
  playerIdeology,
  enabled = false,
}) {
  const playerName = getCurrentPlayerName();

  const collection = useMemo(() => {
    if (!enabled || !provinces?.features?.length) return null;
    const seen = new Set();
    const features = [];

    for (const city of mapCities) {
      const normalized = normalizeMapCity(city);
      const pc = playerCities.find((p) => p.name === normalized.name);
      const entry = {
        ...normalized,
        isOwn: Boolean(pc) || normalized.status === 'own',
        ownerIdeology: resolveCityIdeology(normalized, playerName, playerIdeology),
      };
      if (!entry.ownerIdeology) continue;

      const feature = findProvinceFeature(provinces, entry, playerCities);
      const iso = feature?.properties?.shapeISO;
      if (!feature || !iso || seen.has(iso)) continue;
      seen.add(iso);
      features.push({
        ...feature,
        properties: {
          ...feature.properties,
          _cityName: entry.name,
          _ideology: entry.ownerIdeology,
          _isOwn: entry.isOwn,
          _isAlly: isNaturalAlly(playerIdeology, entry.ownerIdeology),
        },
      });
    }

    if (!features.length) return null;
    return { type: 'FeatureCollection', features };
  }, [enabled, provinces, mapCities, playerCities, playerName, playerIdeology]);

  if (!collection) return null;

  return (
    <GeoJSON
      key={`ideology-provinces-${collection.features.length}`}
      data={collection}
      style={(feature) => {
        const ideology = feature.properties?._ideology;
        const isOwn = feature.properties?._isOwn;
        const isAlly = feature.properties?._isAlly;
        return getIdeologyTerritoryStyle(ideology, { isOwn, isAlly });
      }}
      smoothFactor={1.5}
      interactive={false}
      className="map-ideology-province-layer"
    />
  );
}
