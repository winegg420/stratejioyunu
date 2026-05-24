import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMapCityDisplayName } from '../map/mapCityDisplayName';

const FADE_MS = 140;

/**
 * Şehir hover etiketi — yalnızca şehir adı, imleci takip eder.
 */
export default function MapCoordTooltip({ hover, portalRoot = null }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [payload, setPayload] = useState(null);
  const rafRef = useRef(0);
  const fadeTimerRef = useRef(null);
  const hadContentRef = useRef(false);

  useEffect(() => {
    if (hover) {
      hadContentRef.current = true;
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

    if (!hadContentRef.current) return undefined;

    setFading(true);
    fadeTimerRef.current = window.setTimeout(() => {
      hadContentRef.current = false;
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
  }, [hover]);

  useEffect(() => () => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
  }, []);

  if (!visible || !payload) return null;

  const mountNode = portalRoot
    ?? (typeof document !== 'undefined' ? document.body : null);
  if (!mountNode) return null;

  return createPortal(
    <div
      className={[
        'map-coord-tooltip',
        fading && 'map-coord-tooltip--fade-out',
      ].filter(Boolean).join(' ')}
      style={{ left: pos.x, top: pos.y }}
      role="tooltip"
    >
      <span className="map-coord-tooltip__city">
        {getMapCityDisplayName(payload.name)}
      </span>
    </div>,
    mountNode,
  );
}
