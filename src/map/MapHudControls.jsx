import { useMap } from 'react-leaflet';

export default function MapHudControls({ activeCity, onFocusCity }) {
  const map = useMap();

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  const focusHome = () => {
    if (activeCity?.lat != null && activeCity?.lng != null) {
      map.flyTo([activeCity.lat, activeCity.lng], 8, { duration: 0.9 });
      onFocusCity?.();
    }
  };

  return (
    <div className="map-hud-panel" aria-label="Harita kontrolleri">
      <span className="map-hud-label">TACTICAL HUD</span>
      <button type="button" className="map-hud-btn" onClick={zoomIn} aria-label="Yakınlaştır">
        +
      </button>
      <button type="button" className="map-hud-btn" onClick={zoomOut} aria-label="Uzaklaştır">
        −
      </button>
      <button
        type="button"
        className="map-hud-btn map-hud-btn--focus"
        onClick={focusHome}
        aria-label="Aktif şehre odaklan"
        title="Aktif şehre odaklan"
      >
        <span className="map-hud-compass" aria-hidden="true">
          ⊕
        </span>
        Odaklan
      </button>
    </div>
  );
}
