import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { findMapCityNearPointer } from './mapCityClick';
import { findProvinceAtLatLng, buildMapTargetFromProvince } from './mapProvincePick';

/**
 * Marker / il katmanı tıklaması kaçarsa — yakın şehir veya tıklanan il poligonu.
 */
export default function MapCityClickRouter({
  provinces,
  mapCities,
  playerCities,
  onSelectCity,
  onProvinceSelect,
  enabled = true,
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (!enabled) return;
      if (map._suppressMapClickUntil && Date.now() < map._suppressMapClickUntil) return;

      const zoom = map.getZoom();
      const radius = Math.max(32, 58 - (zoom - 5) * 6);
      const city = findMapCityNearPointer(
        map,
        e.latlng,
        mapCities,
        playerCities,
        radius,
      );

      if (city) {
        L.DomEvent.stopPropagation(e);
        onSelectCity?.(city);
        return;
      }

      const feature = findProvinceAtLatLng(provinces, e.latlng);
      if (!feature) return;

      L.DomEvent.stopPropagation(e);
      const target = buildMapTargetFromProvince(feature, e.latlng, mapCities, playerCities);
      if (onProvinceSelect) {
        onProvinceSelect(target, feature);
      } else {
        onSelectCity?.(target);
      }
    },
  });

  return null;
}
