import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

/** Aktif üs pini ile sağdaki Tactical HUD arasında siber bağlantı hattı */
export default function MapHudConnector({ lat, lng }) {
  const map = useMap();
  const [line, setLine] = useState(null);

  useEffect(() => {
    if (lat == null || lng == null) {
      setLine(null);
      return;
    }

    const update = () => {
      const container = map.getContainer();
      const wrap = container.closest('.map-container-wrap');
      const hud = wrap?.querySelector('.map-hud-panel');
      if (!hud) {
        setLine(null);
        return;
      }

      const cityPt = map.latLngToContainerPoint([lat, lng]);
      const cRect = container.getBoundingClientRect();
      const hRect = hud.getBoundingClientRect();

      setLine({
        x1: cityPt.x,
        y1: cityPt.y,
        x2: hRect.left - cRect.left,
        y2: hRect.top - cRect.top + hRect.height / 2,
      });
    };

    update();
    map.on('move', update);
    map.on('zoom', update);
    map.on('resize', update);
    window.addEventListener('resize', update);

    return () => {
      map.off('move', update);
      map.off('zoom', update);
      map.off('resize', update);
      window.removeEventListener('resize', update);
    };
  }, [map, lat, lng]);

  if (!line) return null;

  return (
    <svg className="map-hud-connector" aria-hidden="true">
      <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
    </svg>
  );
}
