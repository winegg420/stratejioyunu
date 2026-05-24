import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Leaflet — konteyner boyutu değişince karo döşemelerini yeniden hesapla */
export default function MapResizeEffect() {
  const map = useMap();

  useEffect(() => {
    const run = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* unmount */
      }
    };

    run();
    const raf = requestAnimationFrame(run);
    const t1 = window.setTimeout(run, 150);
    const t2 = window.setTimeout(run, 500);

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      run();
      window.setTimeout(run, 120);
      window.dispatchEvent(new Event('map-layout-changed'));
    };

    window.addEventListener('resize', run);
    window.addEventListener('map-layout-changed', run);
    document.addEventListener('visibilitychange', onVisible);
    const el = map.getContainer();
    const ro = typeof ResizeObserver !== 'undefined' && el
      ? new ResizeObserver(run)
      : null;
    ro?.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', run);
      window.removeEventListener('map-layout-changed', run);
      document.removeEventListener('visibilitychange', onVisible);
      ro?.disconnect();
    };
  }, [map]);

  return null;
}
