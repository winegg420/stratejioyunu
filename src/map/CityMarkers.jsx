import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { pruneCyberEffects } from '../lib/happinessSystem';
import { useGameStore } from '../stores/gameStore';
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
  onCityHover,
  onCityHoverEnd,
}) {
  const storeCities = useGameStore((s) => s.cities);
  const playerName = getCurrentPlayerName();

  const markers = useMemo(
    () => buildMarkerList(mapCities, playerCities),
    [mapCities, playerCities],
  );

  return (
    <>
      {markers.map((city) => {
        const isActive = city.playerId === activeCityId;
        const playerCity = city.playerId
          ? playerCities.find((p) => p.id === city.playerId)
          : null;
        const gameCity = playerCity ? storeCities[playerCity.id] : null;
        const liveMap = mapCities.find((c) => c.name === city.name) ?? city;
        const ownerLabel = getCityOwnerLabel(liveMap, playerName);
        const cyberActive = (pruneCyberEffects(gameCity?.cyberEffects ?? []).length > 0);

        const isUnderAttack =
          underAttack
          && playerCity
          && incomingAttacks.some((a) => a.targetCityId === playerCity.id);

        const markerCity = {
          ...city,
          ...liveMap,
          owner: liveMap.owner ?? city.owner,
          status: liveMap.status ?? city.status,
        };

        const icon = isActive
          ? createActiveHqIcon(markerCity, ownerLabel)
          : city.isOwn
            ? createOwnCityIcon(markerCity, { underAttack: isUnderAttack, ownerLabel, cyberActive })
            : createCityMarkerIcon(markerCity, { underAttack: isUnderAttack, ownerLabel, cyberActive });

        return (
          <Marker
            key={`${city.playerId || city.name}-${ownerLabel}-${cyberActive ? 'c' : 'n'}`}
            position={[city.lat, city.lng]}
            icon={icon}
            zIndexOffset={isActive ? 1200 : city.isOwn ? 400 : 0}
            eventHandlers={{
              click: () => onSelectCity(markerCity),
              mouseover: (e) => {
                const { clientX, clientY } = e.originalEvent;
                onCityHover?.({
                  name: markerCity.name,
                  lat: city.lat,
                  lng: city.lng,
                  x: clientX,
                  y: clientY,
                });
              },
              mousemove: (e) => {
                const { clientX, clientY } = e.originalEvent;
                onCityHover?.({
                  name: markerCity.name,
                  lat: city.lat,
                  lng: city.lng,
                  x: clientX,
                  y: clientY,
                });
              },
              mouseout: () => onCityHoverEnd?.(),
            }}
          />
        );
      })}
    </>
  );
}
