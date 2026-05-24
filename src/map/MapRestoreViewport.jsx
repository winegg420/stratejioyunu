import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Tam ekran çıkışı sonrası kaydedilmiş center/zoom'u geri yükler. */
export default function MapRestoreViewport({ snapshot }) {
  const map = useMap();

  useEffect(() => {
    if (!snapshot?.center || snapshot.at == null) return undefined;

    const { lat, lng } = snapshot.center;
    const zoom = snapshot.zoom ?? map.getZoom();

    const apply = () => {
      try {
        map.setView([lat, lng], zoom, { animate: false });
        map.invalidateSize({ animate: false });
      } catch {
        /* unmount */
      }
    };

    apply();
    const raf = requestAnimationFrame(apply);
    const t = window.setTimeout(apply, 160);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [map, snapshot?.at, snapshot?.center?.lat, snapshot?.center?.lng, snapshot?.zoom]);

  return null;
}
