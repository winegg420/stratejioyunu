import { useMap } from 'react-leaflet';

export default function MapHudControls() {
  const map = useMap();

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  return (
    <div className="map-hud-panel" aria-label="Harita kontrolleri">
      <span className="map-hud-label">TACTICAL HUD</span>
      <button type="button" className="map-hud-btn" onClick={zoomIn} aria-label="Yakınlaştır">
        +
      </button>
      <button type="button" className="map-hud-btn" onClick={zoomOut} aria-label="Uzaklaştır">
        −
      </button>
    </div>
  );
}
