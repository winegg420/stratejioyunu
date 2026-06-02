import { useMemo } from 'react';
import { CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { isMicroCountry } from './mapMicroCountries';
import { IS_WORLD_MAP } from './mapInteractionPolicy';
import { getFeatureBounds, getFeatureCentroid } from './geoUtils';
import { buildMapTargetFromProvince } from './mapProvincePick';
import { filterMapPointsInViewport } from './mapViewportCull';

const MIN_HIT_RADIUS_PX = 8;
const SMALL_COUNTRY_AREA_DEG2 = 12;

function featureAreaDeg2(feature) {
  const b = getFeatureBounds(feature);
  return Math.max(0, b.maxLat - b.minLat) * Math.max(0, b.maxLng - b.minLng);
}

function labelAnchorCenter(feature) {
  const b = getFeatureBounds(feature);
  return {
    lat: (b.minLat + b.maxLat) / 2,
    lng: (b.minLng + b.maxLng) / 2,
  };
}

function isSmallCountryFeature(feature) {
  const name = feature?.properties?.shapeName;
  if (!name) return false;
  if (isMicroCountry(name)) return true;
  return featureAreaDeg2(feature) < SMALL_COUNTRY_AREA_DEG2;
}

/** Küçük ada ülkeleri — min 8px tıklama alanı (poligon çok küçükken) */
export default function MicroCountryHitLayer({
  provinces,
  mapCities,
  playerCities,
  ownProvinceNames,
  onSelectCity,
  zoom = 0,
  viewportBounds = null,
  enabled = true,
}) {
  const hits = useMemo(() => {
    if (!enabled || !IS_WORLD_MAP || !provinces?.features?.length || zoom < 3) return [];

    const raw = provinces.features
      .filter(isSmallCountryFeature)
      .map((feature) => {
        const area = featureAreaDeg2(feature);
        const center = area < 55 ? labelAnchorCenter(feature) : getFeatureCentroid(feature);
        if (center?.lat == null || center?.lng == null) return null;
        return {
          name: feature.properties?.shapeName,
          lat: center.lat,
          lng: center.lng,
          feature,
        };
      })
      .filter(Boolean);

    return filterMapPointsInViewport(raw, viewportBounds, {
      max: raw.length,
      paddingDeg: 6,
    });
  }, [enabled, provinces, zoom, viewportBounds]);

  if (!hits.length) return null;

  return (
    <>
      {hits.map((hit) => (
        <CircleMarker
          key={`micro-hit-${hit.name}`}
          center={[hit.lat, hit.lng]}
          radius={MIN_HIT_RADIUS_PX}
          className="micro-country-hit-target"
          pathOptions={{
            color: 'rgba(0, 255, 136, 0.75)',
            weight: 2,
            fillColor: 'rgba(0, 255, 136, 0.35)',
            fillOpacity: 0.45,
          }}
          interactive
          bubblingMouseEvents={false}
          zIndexOffset={1200}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              const target = buildMapTargetFromProvince(
                hit.feature,
                e.latlng,
                mapCities,
                playerCities,
                ownProvinceNames,
              );
              onSelectCity?.(target);
            },
          }}
        />
      ))}
    </>
  );
}
