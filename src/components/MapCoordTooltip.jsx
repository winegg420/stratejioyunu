import { useEffect, useRef, useState } from 'react';
import { getMapCityDisplayName } from '../map/mapCityDisplayName';
import { latLngToLoc } from '../map/MapMouseCoordinateHud';

const FADE_MS = 140;

/**
 * Şehir hover koordinat kutusu — pointer-events yok, rAF ile konum, hızlı fade-out.
 */
export default function MapCoordTooltip({ hover }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [payload, setPayload] = useState(null);
  const rafRef = useRef(0);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    if (hover) {
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(() => {
        setPayload(hover);
        setPos({
          x: Math.round(hover.x + 14),
          y: Math.round(hover.y),
        });
        setFading(false);
        setVisible(true);
      });
      return undefined;
    }

    if (!visible && !payload) return undefined;

    setFading(true);
    fadeTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      setFading(false);
      setPayload(null);
      fadeTimerRef.current = null;
    }, FADE_MS);

    return () => {
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [hover, visible, payload]);

  useEffect(() => () => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
  }, []);

  if (!visible || !payload) return null;

  const loc = latLngToLoc(payload.lat, payload.lng);

  return (
    <div
      className={[
        'map-coord-tooltip',
        fading && 'map-coord-tooltip--fade-out',
      ].filter(Boolean).join(' ')}
      style={{ left: pos.x, top: pos.y }}
      role="tooltip"
    >
      {payload.name && (
        <span className="map-coord-tooltip__city">
          {getMapCityDisplayName(payload.name)}
        </span>
      )}
      <span>{`LOC: ${loc.x}, ${loc.y}`}</span>
    </div>
  );
}
