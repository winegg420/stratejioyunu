import { useMap } from 'react-leaflet';
import { MAP_GEO } from './mapGeoConfig';

export default function MapHudControls({ onWorldView }) {
  const map = useMap();

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  const flyWorld = () => {
    if (onWorldView) {
      onWorldView();
      return;
    }
    map.flyTo(MAP_GEO.center, MAP_GEO.worldOverviewZoom, {
      animate: true,
      duration: 0.85,
      easeLinearity: 0.25,
    });
  };

  return (
    <div className="map-hud-panel" aria-label="Harita kontrolleri">
      <button type="button" className="map-hud-btn" onClick={zoomIn} aria-label="Yakınlaştır">
        +
      </button>
      <button type="button" className="map-hud-btn" onClick={zoomOut} aria-label="Uzaklaştır">
        −
      </button>
      <button
        type="button"
        className="map-hud-btn map-hud-btn--world"
        onClick={flyWorld}
        aria-label="Dünya görünümü"
        title="Dünya görünümü"
      >
        ⊕
      </button>
    </div>
  );
}
