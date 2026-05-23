import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { BOT_MARKER_ORANGE, EMPIRE_CITY_GLOW } from './cityMarkerUtils';
import { CITY_STATUS_COLORS } from './mapUtils';
import { normalizeMapCity } from './botCityUtils';

const DOT_SIZE = 10;

function createDotIcon({ color, variant }) {
  const cls = [
    'map-city-dot',
    variant === 'own' && 'map-city-dot--own',
    variant === 'bot' && 'map-city-dot--bot',
  ].filter(Boolean).join(' ');

  return L.divIcon({
    className: cls,
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

/** Zoom out — neon noktalar (kendi: yeşil, bot: altın) */
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
        let variant = 'default';
        let color = CITY_STATUS_COLORS[city.status] ?? CITY_STATUS_COLORS.enemy;
        if (city.isOwn || city.status === 'own') {
          variant = 'own';
          color = EMPIRE_CITY_GLOW;
        } else if (city.status === 'bot') {
          variant = 'bot';
          color = BOT_MARKER_ORANGE;
        }
        return (
          <Marker
            key={`dot-${city.name}`}
            position={[city.lat, city.lng]}
            icon={createDotIcon({ color, variant })}
            interactive={false}
            zIndexOffset={500}
          />
        );
      })}
    </>
  );
}
