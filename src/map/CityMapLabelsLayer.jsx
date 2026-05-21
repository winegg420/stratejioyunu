import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { getCityOwnerLabel } from './mapOwnership';
import { normalizeMapCity } from './botCityUtils';

const ZOOM_LABEL_MIN = 6;

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLine(city, ownerLabel) {
  if (city.status === 'bot') return 'BOT ÜSSÜ';
  if (city.status === 'own' || city.isOwn) return ownerLabel || 'SİZ';
  if (city.status === 'empty' || !ownerLabel || ownerLabel === 'Boş') return 'BOŞ';
  return ownerLabel;
}

function createCityLabelIcon(city, ownerLabel) {
  const status = statusLine(city, ownerLabel);
  const statusClass = city.status === 'bot'
    ? 'map-city-centroid-label__status--bot'
    : city.status === 'empty'
      ? 'map-city-centroid-label__status--empty'
      : city.isOwn || city.status === 'own'
        ? 'map-city-centroid-label__status--own'
        : 'map-city-centroid-label__status--enemy';

  return L.divIcon({
    className: 'map-city-centroid-label',
    html: `
      <div class="map-city-centroid-label__inner">
        <span class="map-city-centroid-label__name">${escapeHtml(city.name)}</span>
        <span class="map-city-centroid-label__status ${statusClass}">${escapeHtml(status)}</span>
      </div>
    `,
    iconSize: [128, 36],
    iconAnchor: [64, 18],
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
  const playerName = getCurrentPlayerName();
  const show = zoom >= ZOOM_LABEL_MIN;

  const cities = useMemo(
    () => buildCityList(mapCities, playerCities),
    [mapCities, playerCities],
  );

  if (!show) return null;

  return (
    <>
      {cities.map((city) => {
        if (city.lat == null || city.lng == null) return null;
        const ownerLabel = getCityOwnerLabel(city, playerName);
        return (
          <Marker
            key={`centroid-label-${city.name}`}
            position={[city.lat, city.lng]}
            icon={createCityLabelIcon(city, ownerLabel)}
            interactive={false}
            zIndexOffset={600}
          />
        );
      })}
    </>
  );
}
