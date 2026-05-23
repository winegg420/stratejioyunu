import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { WORLD_ROLES } from '../data/worldCitiesCatalog';
import { normalizeMapCity } from './botCityUtils';
import { MAP_ZOOM_LABEL_MIN } from './mapZoomConfig';

const RETICLE_SVG = (color = '#ff3355', { dim = false } = {}) => `
  <svg class="map-target-reticle__svg" viewBox="0 0 32 32" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" fill="none" stroke="${color}" stroke-width="0.5" opacity="${dim ? '0.22' : '0.35'}"/>
    <line x1="16" y1="1" x2="16" y2="9" stroke="${color}" stroke-width="1.1" opacity="${dim ? '0.45' : '0.95'}"/>
    <line x1="16" y1="23" x2="16" y2="31" stroke="${color}" stroke-width="1.1" opacity="${dim ? '0.45' : '0.95'}"/>
    <line x1="1" y1="16" x2="9" y2="16" stroke="${color}" stroke-width="1.1" opacity="${dim ? '0.45' : '0.95'}"/>
    <line x1="23" y1="16" x2="31" y2="16" stroke="${color}" stroke-width="1.1" opacity="${dim ? '0.45' : '0.95'}"/>
    <circle cx="16" cy="16" r="1.8" fill="${color}" opacity="${dim ? '0.5' : '0.9'}"/>
  </svg>
`;

function createReticleIcon(color, { bot = false } = {}) {
  return L.divIcon({
    className: `map-target-reticle${bot ? ' map-target-reticle--bot' : ''}`,
    html: `<span class="map-target-reticle__hit">${RETICLE_SVG(color, { dim: bot })}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

const HOSTILE = createReticleIcon('#ff3355');
const NEUTRAL = createReticleIcon('#94a3b8');
const BOT_COASTAL = createReticleIcon('#fbbf24', { bot: true });
const BOT_CAPITAL = createReticleIcon('#f59e0b', { bot: true });
const OPEN_INLAND = createReticleIcon('#4ade80', { bot: true });

export default function CityTargetReticleLayer({
  mapCities,
  playerCities,
  zoom = 0,
  onSelectCity,
}) {
  if (zoom < MAP_ZOOM_LABEL_MIN) return null;
  const targets = useMemo(() => {
    const own = new Set(playerCities.map((c) => c.name));
    const list = [];
    for (const raw of mapCities) {
      const city = normalizeMapCity(raw);
      if (own.has(city.name) || city.status === 'own') continue;
      if (city.lat == null || city.lng == null) continue;
      list.push(city);
    }
    return list;
  }, [mapCities, playerCities]);

  return (
    <>
      {targets.map((city) => (
        <Marker
          key={`reticle-${city.name}`}
          position={[city.lat, city.lng]}
          icon={
            city.worldRole === WORLD_ROLES.BOT_CAPITAL
              ? BOT_CAPITAL
              : city.worldRole === WORLD_ROLES.BOT_COASTAL || city.status === 'bot'
                ? BOT_COASTAL
                : city.worldRole === WORLD_ROLES.OPEN_INLAND
                  ? OPEN_INLAND
                  : city.status === 'empty'
                    ? NEUTRAL
                    : HOSTILE
          }
          interactive={Boolean(onSelectCity)}
          zIndexOffset={950}
          bubblingMouseEvents={false}
          eventHandlers={onSelectCity ? {
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onSelectCity(city);
            },
          } : undefined}
        />
      ))}
    </>
  );
}
