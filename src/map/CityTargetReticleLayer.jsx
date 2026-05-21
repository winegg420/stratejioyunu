import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { normalizeMapCity } from './botCityUtils';

const RETICLE_SVG = (color = '#ff3355') => `
  <svg class="map-target-reticle__svg" viewBox="0 0 32 32" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.35"/>
    <line x1="16" y1="1" x2="16" y2="9" stroke="${color}" stroke-width="1.1" opacity="0.95"/>
    <line x1="16" y1="23" x2="16" y2="31" stroke="${color}" stroke-width="1.1" opacity="0.95"/>
    <line x1="1" y1="16" x2="9" y2="16" stroke="${color}" stroke-width="1.1" opacity="0.95"/>
    <line x1="23" y1="16" x2="31" y2="16" stroke="${color}" stroke-width="1.1" opacity="0.95"/>
    <circle cx="16" cy="16" r="1.8" fill="${color}" opacity="0.9"/>
  </svg>
`;

function createReticleIcon(color) {
  return L.divIcon({
    className: 'map-target-reticle',
    html: RETICLE_SVG(color),
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const HOSTILE = createReticleIcon('#ff3355');
const NEUTRAL = createReticleIcon('#94a3b8');

export default function CityTargetReticleLayer({ mapCities, playerCities }) {
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
          icon={city.status === 'empty' ? NEUTRAL : HOSTILE}
          interactive={false}
          zIndexOffset={450}
        />
      ))}
    </>
  );
}
