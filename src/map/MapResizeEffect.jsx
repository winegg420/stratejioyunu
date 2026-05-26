import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Leaflet — konteyner boyutu değişince karo döşemelerini yeniden hesapla */
export default function MapResizeEffect({ layoutRev = 'normal' }) {
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
    const timers = [80, 200, 450, 900].map((ms) => window.setTimeout(run, ms));

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
    if (el?.parentElement) ro?.observe(el.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', run);
      window.removeEventListener('map-layout-changed', run);
      document.removeEventListener('visibilitychange', onVisible);
      ro?.disconnect();
    };
  }, [map, layoutRev]);

  return null;
}
