import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { fitMapWorld } from './mapWorldFitUtils';

/** İlk yüklemede + map-world-fit olayında dünya görünümü; kullanıcı zoom'unu bozmaz */
export default function MapWorldFit({
  enabled = true,
  isFullscreen = false,
  layoutRev = 'normal',
  ideologyView = false,
}) {
  const map = useMap();
  const fitTimerRef = useRef(null);
  const didInitialFitRef = useRef(false);

  const runFit = useCallback(() => {
    try {
      map.invalidateSize({ animate: false, pan: false });
      const sz = map.getSize();
      if (sz.x < 80 || sz.y < 80) return;
      fitMapWorld(map, { isFullscreen });
    } catch {
      /* unmount */
    }
  }, [map, isFullscreen]);

  const scheduleFit = useCallback(
    (force = false) => {
      if (!enabled && !force) return;
      window.clearTimeout(fitTimerRef.current);
      fitTimerRef.current = window.setTimeout(() => runFit(), 80);
    },
    [enabled, runFit],
  );

  useEffect(() => {
    if (!enabled) return undefined;

    if (!didInitialFitRef.current) {
      didInitialFitRef.current = true;
      scheduleFit(true);
      const timers = [200, 500].map((ms) => window.setTimeout(() => scheduleFit(true), ms));
      const onWorldFit = () => scheduleFit(true);
      window.addEventListener('map-world-fit', onWorldFit);

      return () => {
        timers.forEach((id) => window.clearTimeout(id));
        window.clearTimeout(fitTimerRef.current);
        window.removeEventListener('map-world-fit', onWorldFit);
      };
    }

    return undefined;
  }, [enabled, scheduleFit, layoutRev]);

  useEffect(() => {
    if (!enabled) return undefined;
    const run = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        /* unmount */
      }
    };
    run();
    const timer = window.setTimeout(run, 100);
    return () => window.clearTimeout(timer);
  }, [enabled, map, layoutRev, isFullscreen]);

  return null;
}
