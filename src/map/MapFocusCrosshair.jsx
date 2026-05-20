import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';

export default function MapFocusCrosshair({ lat, lng }) {
  const map = useMap();
  const [host, setHost] = useState(null);

  useEffect(() => {
    const wrap = map.getContainer()?.closest('.map-container-wrap');
    setHost(wrap ?? map.getContainer());
  }, [map]);

  const focusBase = () => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], 8, { animate: true, duration: 1.5, easeLinearity: 0.25 });
  };

  if (!host) return null;

  return createPortal(
    <button
      type="button"
      className="map-focus-crosshair map-focus-crosshair--neon"
      onClick={focusBase}
      aria-label="Üsse odaklan"
      title="Aktif şehre odaklan"
    >
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 10l5.5 5.5M32.5 32.5 38 38M38 10l-5.5 5.5M15.5 32.5 10 38" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
      </svg>
      <span className="map-focus-crosshair__label">ÜSSE ODAKLAN</span>
    </button>,
    host,
  );
}
