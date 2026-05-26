import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import { useLanguage } from '../context/LanguageContext';
import { resolvePlayerCountryFocus } from '../lib/mapPlayerFocus';

export default function MapFocusCrosshair({
  activeCityId,
  playerCities,
  mapCities,
  onFocusBase,
}) {
  const map = useMap();
  const { t, countryLabel } = useLanguage();
  const [host, setHost] = useState(null);

  useEffect(() => {
    const wrap = map.getContainer()?.closest('.map-container-wrap');
    setHost(wrap ?? map.getContainer());
  }, [map]);

  const focusBase = () => {
    if (onFocusBase) {
      onFocusBase();
      return;
    }
    const target = resolvePlayerCountryFocus({ playerCities, mapCities, preferMainHq: true });
    if (!target) return;
    const zoom = target.zoom ?? 5;
    map.flyTo([target.lat, target.lng], zoom, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25,
    });
  };

  const target = resolvePlayerCountryFocus({ playerCities, mapCities, preferMainHq: true });
  const countryName = target?.name ? countryLabel(target.name) : null;
  const title = countryName
    ? `${countryName} ülkesine odaklan`
    : 'Aktif ülkeye odaklan';

  if (!host) return null;

  return createPortal(
    <button
      type="button"
      className="map-focus-crosshair map-focus-crosshair--neon"
      onClick={focusBase}
      aria-label={title}
      title={title}
    >
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 10l5.5 5.5M32.5 32.5 38 38M38 10l-5.5 5.5M15.5 32.5 10 38" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
      </svg>
      <span className="map-focus-crosshair__label">{t('map.focus.focusBase')}</span>
    </button>,
    host,
  );
}
