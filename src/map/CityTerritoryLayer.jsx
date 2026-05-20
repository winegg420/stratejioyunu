import { useMemo } from 'react';
import { Marker, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { getCityOwnerLabel } from './mapOwnership';
import { inferCityTier } from './cyberMapConfig';

const RADIUS_DEG = {
  capital: 0.42,
  metropolis: 0.32,
  town: 0.24,
  default: 0.2,
};

function circleRing(lat, lng, radiusDeg, points = 56) {
  const ring = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    ring.push([
      lat + Math.cos(angle) * radiusDeg,
      lng + Math.sin(angle) * radiusDeg,
    ]);
  }
  return ring;
}

function getTerritoryStyle(city) {
  const isOwn = city.isOwn || city.status === 'own';
  if (isOwn) {
    return {
      fillColor: '#22ff88',
      fillOpacity: 0.1,
      color: '#22ff88',
      weight: 2.6,
      opacity: 0.9,
    };
  }
  if (city.status === 'empty') {
    return {
      fillColor: '#64748b',
      fillOpacity: 0.08,
      color: '#ef4444',
      weight: 2.2,
      opacity: 0.75,
      dashArray: '6 8',
    };
  }
  return {
    fillColor: '#ef4444',
    fillOpacity: 0.1,
    color: '#ef4444',
    weight: 2.6,
    opacity: 0.88,
  };
}

function territoryLabelIcon(cityName, ownerLabel, isOwn) {
  return L.divIcon({
    className: `city-territory-label${isOwn ? ' city-territory-label--own' : ''}`,
    html: `
      <div class="city-territory-label__inner">
        <span class="city-territory-label__city">${cityName}</span>
        <span class="city-territory-label__owner">${ownerLabel}</span>
      </div>
    `,
    iconSize: [130, 40],
    iconAnchor: [65, 20],
  });
}

export default function CityTerritoryLayer({ mapCities, playerCities, playerName }) {
  const cities = useMemo(() => {
    const byName = new Map();
    for (const city of mapCities) {
      const pc = playerCities.find((p) => p.name === city.name);
      byName.set(city.name, {
        ...city,
        lat: pc?.lat ?? city.lat,
        lng: pc?.lng ?? city.lng,
        isOwn: Boolean(pc) || city.status === 'own',
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
        tier: 'town',
      });
    }
    return [...byName.values()];
  }, [mapCities, playerCities]);

  return (
    <>
      {cities.map((city) => {
        const tier = inferCityTier(city);
        const radius = RADIUS_DEG[tier] ?? RADIUS_DEG.default;
        const positions = circleRing(city.lat, city.lng, radius);
        const style = getTerritoryStyle(city);

        return (
          <Polygon
            key={`territory-${city.name}`}
            positions={positions}
            pathOptions={{
              ...style,
              lineJoin: 'round',
              lineCap: 'round',
            }}
            smoothFactor={1.5}
          />
        );
      })}
      {cities.map((city) => {
        const ownerLabel = getCityOwnerLabel(city, playerName);
        const isOwn = city.isOwn || city.status === 'own';
        return (
          <Marker
            key={`territory-label-${city.name}`}
            position={[city.lat, city.lng]}
            icon={territoryLabelIcon(city.name, ownerLabel, isOwn)}
            interactive={false}
            zIndexOffset={-100}
          />
        );
      })}
    </>
  );
}
