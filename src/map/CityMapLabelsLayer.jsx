import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { buildMapCitySearchList } from '../lib/mapCitySearchList';
import { getMapCityDisplayName } from './mapCityDisplayName';
import { MAP_ZOOM_LABEL_MIN } from './mapZoomConfig';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelIconSize(displayName, compact) {
  const charW = compact ? 5.5 : 6.5;
  const pad = compact ? 18 : 22;
  const width = Math.min(compact ? 108 : 148, Math.max(compact ? 48 : 56, displayName.length * charW + pad));
  const height = compact ? 16 : 22;
  return { width, height };
}

function createCityLabelIcon(city, { isOwn = false, compact = false } = {}) {
  const displayName = getMapCityDisplayName(city.name);
  const isBot = city.status === 'bot';
  const { width, height } = labelIconSize(displayName, compact);

  return L.divIcon({
    className: [
      'map-city-centroid-label',
      compact && 'map-city-centroid-label--compact',
      isBot && 'map-city-centroid-label--bot',
      isOwn && 'map-city-centroid-label--own',
    ].filter(Boolean).join(' '),
    html: [
      '<div class="map-city-centroid-label__inner">',
      '<span class="map-city-centroid-label__dot" aria-hidden="true"></span>',
      `<span class="map-city-centroid-label__name">${escapeHtml(displayName)}</span>`,
      '</div>',
    ].join(''),
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  });
}

export default function CityMapLabelsLayer({
  mapCities,
  playerCities,
  provinces = null,
  zoom = 0,
  onSelectCity,
}) {
  const show = zoom >= MAP_ZOOM_LABEL_MIN;
  const compact = zoom < 6;

  const cities = useMemo(() => {
    const playerNames = new Set(playerCities.map((p) => p.name));
    const playerProvinces = new Set(
      playerCities.map((p) => p.provinceName).filter(Boolean),
    );
    return buildMapCitySearchList(mapCities, provinces, playerCities).map((city) => {
      const pc = playerCities.find(
        (p) => p.name === city.name
          || p.provinceName === city.provinceName
          || p.provinceName === city.name,
      );
      const provinceKey = city.provinceName ?? city.name;
      return {
        ...city,
        lat: pc?.lat ?? city.lat,
        lng: pc?.lng ?? city.lng,
        isOwn: Boolean(pc)
          || city.status === 'own'
          || playerNames.has(city.name)
          || playerProvinces.has(provinceKey),
      };
    });
  }, [mapCities, provinces, playerCities]);

  if (!show) return null;

  return (
    <>
      {cities.map((city) => {
        if (city.lat == null || city.lng == null) return null;
        return (
          <Marker
            key={`centroid-label-${city.name}`}
            position={[city.lat, city.lng]}
            icon={createCityLabelIcon(city, { isOwn: city.isOwn, compact })}
            interactive={false}
            zIndexOffset={1100}
          />
        );
      })}
    </>
  );
}
