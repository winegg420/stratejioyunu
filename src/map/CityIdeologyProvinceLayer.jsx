import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { ideologyForMapSeed } from '../lib/mapIdeologyDistribution';
import { getIdeologyTerritoryStyle, getIdeologyProfile, isNaturalAlly } from '../lib/ideologySystem';
import { getOwnProvinceStyle } from './mapUtils';
import { resolveOwnerIdeology } from './mapOwnership';
import { normalizeMapCity } from './botCityUtils';
import { findProvinceFeature, resolveCityProvinceName } from './cityProvinceMatch';
import { computeFeatureCentroid } from '../lib/botProvinceAssignment';

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

    const cityByIso = new Map();
    const cityByProvince = new Map();

    for (const city of mapCities) {
      const normalized = normalizeMapCity(city);
      const entry = {
        ...normalized,
        isOwn: Boolean(playerCities.find((p) => p.name === normalized.name))
          || normalized.status === 'own',
        ownerIdeology: resolveOwnerIdeology(normalized, playerName, playerIdeology),
      };
      const feature = findProvinceFeature(provinces, entry, playerCities);
      const iso = feature?.properties?.shapeISO;
      const provinceName = resolveCityProvinceName(entry, playerCities);
      if (iso) cityByIso.set(iso, entry);
      if (provinceName) cityByProvince.set(provinceName, entry);
    }

    const features = provinces.features.map((feature) => {
      const iso = feature.properties?.shapeISO;
      const provinceName = feature.properties?.shapeName ?? '';
      const matched = (iso && cityByIso.get(iso))
        ?? cityByProvince.get(provinceName)
        ?? null;

      let ideology = matched?.ownerIdeology ?? null;
      if (!ideology) {
        const centroid = computeFeatureCentroid(feature);
        ideology = ideologyForMapSeed(`province:${iso || provinceName}`, centroid ?? {});
      }

      const isOwn = matched?.isOwn ?? false;
      const isAlly = isNaturalAlly(playerIdeology, ideology);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          _cityName: matched?.name ?? provinceName,
          _ideology: ideology,
          _isOwn: isOwn,
          _isAlly: isAlly,
        },
      };
    });

    return { type: 'FeatureCollection', features };
  }, [enabled, provinces, mapCities, playerCities, playerName, playerIdeology]);

  if (!collection) return null;

  return (
    <GeoJSON
      key={`ideology-all-${collection.features.length}-${playerIdeology}`}
      data={collection}
      style={(feature) => {
        const isOwn = feature.properties?._isOwn;
        if (isOwn) return getOwnProvinceStyle();
        const ideology = feature.properties?._ideology;
        const isAlly = feature.properties?._isAlly;
        return getIdeologyTerritoryStyle(ideology, { isOwn, isAlly });
      }}
      smoothFactor={1.5}
      interactive={false}
      className="map-ideology-province-layer"
    />
  );
}
