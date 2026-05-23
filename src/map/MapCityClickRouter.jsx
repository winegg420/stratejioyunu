import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { findMapCityNearPointer } from './mapCityClick';

/**
 * Marker katmanları tıklamayı kaçırsa bile — haritada şehre yakın tıklamayı yakala.
 */
export default function MapCityClickRouter({
  mapCities,
  playerCities,
  onSelectCity,
  enabled = true,
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (!enabled || !onSelectCity) return;
      const zoom = map.getZoom();
      const radius = Math.max(28, 52 - (zoom - 5) * 6);
      const city = findMapCityNearPointer(
        map,
        e.latlng,
        mapCities,
        playerCities,
        radius,
      );
      if (!city) return;
      L.DomEvent.stopPropagation(e);
      onSelectCity(city);
    },
  });

  return null;
}
