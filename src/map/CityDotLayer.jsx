import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { BOT_MARKER_ORANGE } from './cityMarkerUtils';
import { CITY_STATUS_COLORS } from './mapUtils';
import { normalizeMapCity } from './botCityUtils';

const DOT_SIZE = 8;

function createDotIcon(color) {
  return L.divIcon({
    className: 'map-city-dot',
    html: `<span class="map-city-dot__core" style="background:${color}"></span>`,
    iconSize: [DOT_SIZE, DOT_SIZE],
    iconAnchor: [DOT_SIZE / 2, DOT_SIZE / 2],
  });
}

function buildCityList(mapCities, playerCities) {
  const byName = new Map();
  for (const city of mapCities) {
    const normalized = normalizeMapCity(city);
    const pc = playerCities.find((p) => p.name === normalized.name);
    byName.set(normalized.name, {
      ...normalized,
      lat: pc?.lat ?? normalized.lat,
      lng: pc?.lng ?? normalized.lng,
      isOwn: Boolean(pc) || normalized.status === 'own',
    });
  }
  for (const pc of playerCities) {
    if (byName.has(pc.name)) continue;
    byName.set(pc.name, {
      name: pc.name,
      lat: pc.lat,
      lng: pc.lng,
      status: 'own',
      isOwn: true,
    });
  }
  return [...byName.values()];
}

/** Zoom out — yalnızca renkli nokta (+ bot için küçük ◆) */
export default function CityDotLayer({
  mapCities,
  playerCities,
  visible = true,
}) {
  const cities = useMemo(
    () => buildCityList(mapCities, playerCities),
    [mapCities, playerCities],
  );

  if (!visible) return null;

  return (
    <>
      {cities.map((city) => {
        if (city.lat == null || city.lng == null) return null;
        const color = city.status === 'bot'
          ? BOT_MARKER_ORANGE
          : (CITY_STATUS_COLORS[city.status] ?? CITY_STATUS_COLORS.enemy);
        return (
          <Marker
            key={`dot-${city.name}`}
            position={[city.lat, city.lng]}
            icon={createDotIcon(color)}
            interactive={false}
            zIndexOffset={500}
          />
        );
      })}
    </>
  );
}
