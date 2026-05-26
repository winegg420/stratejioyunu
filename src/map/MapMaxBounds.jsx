import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_GEO } from './mapGeoConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';
import { applyWorldMapZoomPolicy, getMapGameplayBounds } from './mapWorldFitUtils';

/** Harita sınırları ve zoom aralığı — dünya modunda serbest pan/zoom. */
export default function MapMaxBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMaxZoom(MAP_GEO.maxZoom);

    if (IS_WORLD_MAP) {
      const gameplay = getMapGameplayBounds();
      map.setMaxBounds(gameplay);
      map.options.maxBoundsViscosity = 0.82;
      map.options.worldCopyJump = true;
      map.dragging.enable();
      applyWorldMapZoomPolicy(map);
      return;
    }

    map.setMinZoom(MAP_GEO.minZoom);

    map.options.maxBoundsViscosity = 0.05;
    map.setMaxBounds(TURKEY_MAX_BOUNDS);
    map.dragging.disable();
    if (map.getZoom() < 4) {
      map.setZoom(4);
    }
  }, [map]);

  return null;
}
