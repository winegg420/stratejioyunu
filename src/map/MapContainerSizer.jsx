import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Leaflet, flex layout’ta ilk ölçümde küçük/kare kalabiliyor.
 * Üst sarmalayıcının gerçek px boyutunu konteynere yazar ve invalidateSize çağırır.
 */
export default function MapContainerSizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const host = container.parentElement;
    if (!host) return undefined;

    const apply = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 48 || h < 48) return;

      container.style.position = 'absolute';
      container.style.inset = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.maxWidth = 'none';
      container.style.maxHeight = 'none';
      container.style.margin = '0';

      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        /* unmount */
      }
    };

    apply();
    const raf = requestAnimationFrame(apply);
    const timers = [0, 40, 100, 200, 400, 800, 1600].map((ms) => window.setTimeout(apply, ms));

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    ro?.observe(host);
    if (host.parentElement) ro?.observe(host.parentElement);

    window.addEventListener('resize', apply);
    window.addEventListener('map-layout-changed', apply);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      ro?.disconnect();
      window.removeEventListener('resize', apply);
      window.removeEventListener('map-layout-changed', apply);
    };
  }, [map]);

  return null;
}
