import { useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { IS_WORLD_MAP } from './mapInteractionPolicy';
import { applyWorldMapZoomPolicy, fitMapWorld } from './mapWorldFitUtils';

/** Dünya haritası — sabit min/max zoom; kullanıcı wheel ve +/- ile serbest zoom */
export default function MapViewportMinZoom({ isFullscreen = false }) {
  const map = useMap();

  const syncSize = useCallback(() => {
    if (!IS_WORLD_MAP) return;
    try {
      map.invalidateSize({ animate: false, pan: false });
      applyWorldMapZoomPolicy(map);
    } catch {
      /* unmount */
    }
  }, [map]);

  const fitWorld = useCallback(() => {
    if (!IS_WORLD_MAP) return;
    try {
      fitMapWorld(map, { isFullscreen });
    } catch {
      /* unmount */
    }
  }, [map, isFullscreen]);

  useEffect(() => {
    if (!IS_WORLD_MAP) return undefined;

    syncSize();
    const raf = requestAnimationFrame(syncSize);

    const onLayout = () => syncSize();
    const onWorldFit = () => fitWorld();

    map.on('resize', syncSize);
    window.addEventListener('map-layout-changed', onLayout);
    window.addEventListener('resize', onLayout);
    window.addEventListener('map-world-fit', onWorldFit);

    return () => {
      cancelAnimationFrame(raf);
      map.off('resize', syncSize);
      window.removeEventListener('map-layout-changed', onLayout);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('map-world-fit', onWorldFit);
    };
  }, [map, syncSize, fitWorld, isFullscreen]);

  return null;
}
