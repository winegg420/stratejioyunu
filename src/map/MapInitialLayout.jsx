import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { IS_WORLD_MAP } from './mapInteractionPolicy';

/** invalidateSize + tam ekran girişinde dünya sığdırma */
export default function MapInitialLayout({ isFullscreen = false, ideologyView = false }) {
  const map = useMap();

  useEffect(() => {
    const run = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        /* unmount */
      }
    };

    run();
    const raf = requestAnimationFrame(run);
    const timers = [80, 200, 500, 1000].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('map-layout-changed', run);
    window.addEventListener('resize', run);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('map-layout-changed', run);
      window.removeEventListener('resize', run);
    };
  }, [map, isFullscreen, ideologyView]);

  useEffect(() => {
    if (!IS_WORLD_MAP) return undefined;

    const run = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        /* unmount */
      }
    };

    run();
    const timers = [100, 300].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('map-layout-changed', run);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('map-layout-changed', run);
    };
  }, [map, isFullscreen]);

  return null;
}
