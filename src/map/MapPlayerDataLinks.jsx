import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';

/** Oyuncu şehirleri arası siber veri hatları */
export default function MapPlayerDataLinks({ playerCities }) {
  const links = useMemo(() => {
    const cities = (playerCities ?? []).filter((c) => c.lat != null && c.lng != null);
    const segments = [];
    for (let i = 0; i < cities.length; i += 1) {
      for (let j = i + 1; j < cities.length; j += 1) {
        segments.push({
          key: `${cities[i].id}-${cities[j].id}`,
          positions: [
            [cities[i].lat, cities[i].lng],
            [cities[j].lat, cities[j].lng],
          ],
        });
      }
    }
    return segments;
  }, [playerCities]);

  if (links.length < 1) return null;

  return (
    <>
      {links.map((link) => (
        <Polyline
          key={link.key}
          positions={link.positions}
          pathOptions={{
            color: 'rgba(0, 240, 255, 0.15)',
            weight: 1.2,
            opacity: 0.85,
            dashArray: '5 10',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}
    </>
  );
}
