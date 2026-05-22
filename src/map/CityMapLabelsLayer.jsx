import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { normalizeMapCity } from './botCityUtils';
import { getMapCityDisplayName } from './mapCityDisplayName';
import { MAP_ZOOM_LABEL_MIN } from './mapZoomConfig';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createCityLabelIcon(city) {
  const displayName = getMapCityDisplayName(city.name);
  const isBot = city.status === 'bot';

  return L.divIcon({
    className: `map-city-centroid-label${isBot ? ' map-city-centroid-label--bot' : ''}`,
    html: `
      <div class="map-city-centroid-label__inner">
        <span class="map-city-centroid-label__dot" aria-hidden="true"></span>
        <span class="map-city-centroid-label__name">${escapeHtml(displayName)}</span>
      </div>
    `,
    iconSize: [80, 18],
    iconAnchor: [40, 9],
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

export default function CityMapLabelsLayer({
  mapCities,
  playerCities,
  zoom = 0,
}) {
  const show = zoom >= MAP_ZOOM_LABEL_MIN;

  const cities = useMemo(
    () => buildCityList(mapCities, playerCities),
    [mapCities, playerCities],
  );

  if (!show) return null;

  return (
    <>
      {cities.map((city) => {
        if (city.lat == null || city.lng == null) return null;
        return (
          <Marker
            key={`centroid-label-${city.name}`}
            position={[city.lat, city.lng]}
            icon={createCityLabelIcon(city)}
            interactive={false}
            zIndexOffset={600}
          />
        );
      })}
    </>
  );
}
