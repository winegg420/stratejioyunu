import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_GEO } from './mapGeoConfig';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';

/** Harita sınırları ve zoom aralığı — MAP_GEO ile uyumlu (dünya: zoom 2–7). */
export default function MapMaxBounds() {
  const map = useMap();

  useEffect(() => {
    map.options.maxBoundsViscosity = 0.05;
    map.setMaxBounds(TURKEY_MAX_BOUNDS);
    map.setMinZoom(MAP_GEO.minZoom);
    map.setMaxZoom(MAP_GEO.maxZoom);

    if (MAP_GEO.mode !== 'world' && map.getZoom() < 4) {
      map.setZoom(4);
    }
  }, [map]);

  return null;
}
