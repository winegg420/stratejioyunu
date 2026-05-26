import { useMemo } from 'react';
import { GeoJSON, Marker } from 'react-leaflet';
import L from 'leaflet';
import { getFeatureCentroid } from './geoUtils';
import { normalizeProvinceCode } from './mapOwnership';
import { getCountryDisplayLabel } from '../lib/countryDisplayNames';

function territoryLabelIcon(regionName, ownerName) {
  return L.divIcon({
    className: 'player-territory-label',
    html: `
      <div class="player-territory-label__inner">
        <span class="player-territory-label__region">${regionName}</span>
        <span class="player-territory-label__owner">${ownerName}</span>
      </div>
    `,
    iconSize: [140, 44],
    iconAnchor: [70, 22],
  });
}

export default function PlayerTerritoryLayer({ provinces, playerProvinces, playerName }) {
  const ownFeatures = useMemo(() => {
    if (!provinces?.features?.length || !playerProvinces?.length) return [];
    const codes = new Set(playerProvinces.map(normalizeProvinceCode));
    return provinces.features.filter((f) =>
      codes.has(normalizeProvinceCode(f.properties?.shapeISO)),
    );
  }, [provinces, playerProvinces]);

  const ownCollection = useMemo(() => {
    if (!ownFeatures.length) return null;
    return { type: 'FeatureCollection', features: ownFeatures };
  }, [ownFeatures]);

  if (!ownCollection) return null;

  return (
    <>
      <GeoJSON
        key={`own-territory-${ownFeatures.map((f) => f.properties?.shapeISO).join('-')}`}
        data={ownCollection}
        style={() => ({
          fillColor: '#22ff88',
          fillOpacity: 0.14,
          color: '#22ff88',
          weight: 2.8,
          opacity: 0.85,
          lineJoin: 'round',
          lineCap: 'round',
        })}
        smoothFactor={1.5}
      />
      {ownFeatures.map((feature) => {
        const center = getFeatureCentroid(feature);
        const regionName = getCountryDisplayLabel(feature.properties?.shapeName ?? 'Bölge');
        return (
          <Marker
            key={`territory-label-${feature.properties?.shapeISO}`}
            position={[center.lat, center.lng]}
            icon={territoryLabelIcon(regionName, playerName)}
            interactive={false}
            zIndexOffset={-200}
          />
        );
      })}
    </>
  );
}
