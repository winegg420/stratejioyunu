import { Marker } from 'react-leaflet';
import { createCyberCityIcon } from './cyberMarkers';

export default function CyberCityMarkers({
  cities,
  underAttack,
  incomingAttacks,
  playerCities,
  activeCityId,
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

        return (
          <Marker
            key={city.name}
            position={[city.lat, city.lng]}
            icon={createCyberCityIcon(city, { underAttack: isUnderAttack })}
            eventHandlers={{ click: () => onSelectCity(city) }}
          />
        );
      })}
    </>
  );
}
