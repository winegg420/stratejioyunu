import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { getCityOwnerLabel } from './mapOwnership';
import {
  createActiveHqIcon,
  createCityMarkerIcon,
  createOwnCityIcon,
} from './cityMarkerUtils';

function buildMarkerList(mapCities, playerCities) {
  const byName = new Map();

  for (const city of mapCities) {
    const pc = playerCities.find((p) => p.name === city.name);
    byName.set(city.name, {
      ...city,
      lat: pc?.lat ?? city.lat,
      lng: pc?.lng ?? city.lng,
      playerId: pc?.id ?? null,
      isOwn: Boolean(pc) || city.status === 'own',
    });
  }

  for (const pc of playerCities) {
    if (byName.has(pc.name)) continue;
    byName.set(pc.name, {
      name: pc.name,
      lat: pc.lat,
      lng: pc.lng,
      status: 'own',
      playerId: pc.id,
      isOwn: true,
      tier: 'town',
      type: pc.type,
      owner: null,
    });
  }

  return [...byName.values()];
}

export default function CityMarkers({
  mapCities,
  playerCities,
  activeCityId,
  underAttack,
  incomingAttacks,
  onSelectCity,
}) {
  const markers = useMemo(
    () => buildMarkerList(mapCities, playerCities),
    [mapCities, playerCities],
  );
  const playerName = getCurrentPlayerName();

  return (
    <>
      {markers.map((city) => {
        const isActive = city.playerId === activeCityId;
        const playerCity = city.playerId
          ? playerCities.find((p) => p.id === city.playerId)
          : null;
        const isUnderAttack =
          underAttack
          && playerCity
          && incomingAttacks.some((a) => a.targetCityId === playerCity.id);

        const icon = isActive
          ? createActiveHqIcon()
          : city.isOwn
            ? createOwnCityIcon(city, { underAttack: isUnderAttack })
            : createCityMarkerIcon(city, { underAttack: isUnderAttack });

        return (
          <Marker
            key={city.playerId || city.name}
            position={[city.lat, city.lng]}
            icon={icon}
            zIndexOffset={isActive ? 1200 : city.isOwn ? 400 : 0}
            eventHandlers={{ click: () => onSelectCity(city) }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -6]}
              className="map-city-label-tooltip"
            >
              <span className="map-city-label__name">{city.name}</span>
              <span className="map-city-label__owner">
                {getCityOwnerLabel(city, playerName)}
              </span>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
