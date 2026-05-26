import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';

/** Karo + GeoJSON hazır olana kadar haritayı örter; kırmızı sınır flaşını engeller. */
export default function MapBootOverlay({ visible, message = 'Harita yükleniyor…' }) {
  const map = useMap();
  const [host, setHost] = useState(null);

  useEffect(() => {
    const wrap = map.getContainer()?.closest('.map-container-wrap');
    setHost(wrap ?? map.getContainer());
  }, [map]);

  if (!visible || !host) return null;

  return createPortal(
    <div className="map-boot-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="map-boot-overlay__panel">
        <span className="map-boot-overlay__spinner" aria-hidden="true" />
        <span className="map-boot-overlay__text">{message}</span>
      </div>
    </div>,
    host,
  );
}
