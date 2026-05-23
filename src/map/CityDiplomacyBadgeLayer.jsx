import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { hasDiplomaticPartnership } from '../lib/mapDiplomacyMarkers';
import { useGameStore } from '../stores/gameStore';

function createTreatyIcon() {
  return L.divIcon({
    className: 'map-treaty-badge-marker',
    html: '<span class="map-treaty-badge" title="Ateşkes / Pakt / İttifak">🛡</span>',
    iconSize: [16, 16],
    iconAnchor: [8, 14],
  });
}

export default function CityDiplomacyBadgeLayer({ mapCities, visible = true }) {
  const treaties = useGameStore((s) => s.diplomaticTreaties);
  const now = useGameStore((s) => s.now);

  const partners = useMemo(
    () => (mapCities ?? []).filter(
      (c) => c.lat != null && c.lng != null && c.status !== 'own'
        && hasDiplomaticPartnership(c.owner, { treaties, now }),
    ),
    [mapCities, treaties, now],
  );

  if (!visible || partners.length === 0) return null;

  return (
    <>
      {partners.map((city) => (
        <Marker
          key={`treaty-${city.name}`}
          position={[city.lat, city.lng]}
          icon={createTreatyIcon()}
          interactive={false}
          zIndexOffset={650}
        />
      ))}
    </>
  );
}
