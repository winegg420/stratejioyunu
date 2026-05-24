import L from 'leaflet';
import { Marker } from 'react-leaflet';
import { isMapClickSuppressed } from './mapPanClick';
import { createCyberCityIcon } from './cyberMarkers';

export default function CyberCityMarkers({
  cities,
  underAttack,
  incomingAttacks,
  playerCities,
  activeCityId,
  activeCityName,
  onSelectCity,
}) {
  return (
    <>
      {cities.map((city) => {
        const playerCity = playerCities.find(
          (c) => c.name === city.name || (city.status === 'own' && c.id === activeCityId),
        );
        const isUnderAttack =
          underAttack
          && playerCity
          && incomingAttacks.some((a) => a.targetCityId === playerCity.id);
        const isActive = city.status === 'own' && city.name === activeCityName;

        return (
          <Marker
            key={city.name}
            position={[city.lat, city.lng]}
            icon={createCyberCityIcon(city, { underAttack: isUnderAttack, isActive })}
            zIndexOffset={isActive ? 600 : city.status === 'own' ? 200 : 0}
            bubblingMouseEvents={false}
            eventHandlers={{
              click: (e) => {
                if (isMapClickSuppressed(e.target?._map)) return;
                L.DomEvent.stopPropagation(e);
                onSelectCity(city);
              },
            }}
          />
        );
      })}
    </>
  );
}
