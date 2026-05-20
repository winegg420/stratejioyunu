import { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import { normalizeMapCity } from './botCityUtils';

/** Tüm şehirler için eşit bölge yarıçapı (İstanbul/Trabzon büyük kutu sorunu) */
const TERRITORY_RADIUS_DEG = 0.24;

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
  if (city.status === 'bot') {
    return {
      fillColor: '#64748b',
      fillOpacity: 0.07,
      color: '#94a3b8',
      weight: 2,
      opacity: 0.65,
      dashArray: '5 7',
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

export default function CityTerritoryLayer({ mapCities, playerCities }) {
  const cities = useMemo(() => {
    const byName = new Map();
    for (const city of mapCities) {
      const normalized = normalizeMapCity(city);
      const pc = playerCities.find((p) => p.name === normalized.name || p.name === city.name);
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
        tier: 'town',
      });
    }
    return [...byName.values()];
  }, [mapCities, playerCities]);

  return (
    <>
      {cities.map((city) => {
        const positions = circleRing(city.lat, city.lng, TERRITORY_RADIUS_DEG);
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
    </>
  );
}
