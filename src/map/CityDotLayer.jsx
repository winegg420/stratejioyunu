import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { BOT_MARKER_ORANGE, EMPIRE_CITY_GLOW } from './cityMarkerUtils';
import { getMapCityDisplayColor } from './mapUtils';
import { normalizeMapCity } from './botCityUtils';
import { filterMapPointsInViewport, maxDotsForZoom, dotPixelSizeForZoom } from './mapViewportCull';
import { isMicroCountry } from './mapMicroCountries';
import { hashOwnerColor, isForeignPlayerCity } from './mapUtils';

function createDotIcon({ color, variant, size }) {
  const cls = [
    'map-city-dot',
    variant === 'own' && 'map-city-dot--own',
    variant === 'bot' && 'map-city-dot--bot',
    variant === 'foreign' && 'map-city-dot--foreign',
    variant === 'micro' && 'map-city-dot--micro',
  ].filter(Boolean).join(' ');

  const ring = variant === 'own'
    ? 'box-shadow:0 0 0 2px rgba(34,255,136,0.85), 0 0 8px rgba(34,255,136,0.55);'
    : variant === 'foreign'
      ? 'box-shadow:0 0 0 2px rgba(255,255,255,0.45);'
      : '';

  return L.divIcon({
    className: cls,
    html: `<span class="map-city-dot__core" style="background:${color};width:${size}px;height:${size}px;${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
  playerIdeology = null,
  ideologyView = false,
  visible = true,
  zoom = 0,
  viewportBounds = null,
  renderKey = 0,
}) {
  const playerName = getCurrentPlayerName();
  const cities = useMemo(() => {
    const list = buildCityList(mapCities, playerCities);
    const max = maxDotsForZoom(zoom);
    return filterMapPointsInViewport(list, viewportBounds, { max, paddingDeg: 3 });
  }, [mapCities, playerCities, zoom, viewportBounds]);

  if (!visible) return null;

  return (
    <>
      {cities.map((city) => {
        if (city.lat == null || city.lng == null) return null;
        const micro = isMicroCountry(city.name);
        const size = dotPixelSizeForZoom(zoom, micro);
        let variant = micro ? 'micro' : 'default';
        let color = getMapCityDisplayColor(city, { ideologyView, playerName, playerIdeology });
        if (city.isOwn || city.status === 'own') {
          variant = 'own';
          color = EMPIRE_CITY_GLOW;
        } else if (isForeignPlayerCity(city, playerName)) {
          variant = 'foreign';
          color = hashOwnerColor(city.owner);
        } else if (!ideologyView) {
          if (city.status === 'bot') {
            variant = 'bot';
            color = BOT_MARKER_ORANGE;
          }
        } else if (city.status === 'bot') {
          variant = 'bot';
        }
        return (
          <Marker
            key={`dot-${renderKey}-${city.name}`}
            position={[city.lat, city.lng]}
            icon={createDotIcon({ color, variant, size })}
            interactive={false}
            zIndexOffset={500}
          />
        );
      })}
    </>
  );
}
