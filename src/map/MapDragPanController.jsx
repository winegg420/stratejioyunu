import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const IGNORE_SELECTOR = [
  '.leaflet-control',
  '.leaflet-popup',
  '.leaflet-marker-icon',
  '.leaflet-interactive',
  '.map-marker-wrap',
  '.map-marker-pin',
  '.map-marker-label-stack',
  '.map-target-reticle',
  '.map-target-reticle__hit',
  '.map-city-hit-marker',
  '.map-city-centroid-label',
  'button',
  'input',
  'select',
  'textarea',
  'a',
  '[data-map-no-pan]',
].join(', ');

const DRAG_THRESHOLD_PX = 4;

/**
 * Ana haritada fare ile sürükle-pan (hareket → map.panBy).
 */
export default function MapDragPanController({ enabled = true }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!enabled) {
      container.classList.remove('map-pan-grabbable', 'map-pan--grabbing');
      return undefined;
    }

    container.classList.add('map-pan-grabbable');
    map.dragging.disable();

    let activePointer = null;
    let origin = { x: 0, y: 0 };
    let last = { x: 0, y: 0 };
    let isPanning = false;

    const shouldIgnore = (target) => Boolean(target?.closest?.(IGNORE_SELECTOR));

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (shouldIgnore(e.target)) return;
      activePointer = e.pointerId ?? 1;
      origin = { x: e.clientX, y: e.clientY };
      last = origin;
      isPanning = false;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMouseMove = (e) => {
      if (activePointer === null || e.pointerId !== activePointer) return;

      if (!isPanning) {
        const dist = Math.hypot(e.clientX - origin.x, e.clientY - origin.y);
        if (dist < DRAG_THRESHOLD_PX) return;
        isPanning = true;
        container.classList.add('map-pan--grabbing');
      }

      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      if (dx !== 0 || dy !== 0) {
        map.panBy([-dx, -dy], { animate: false, noMoveStart: true });
      }
    };

    const onMouseUp = (e) => {
      if (activePointer === null || e.pointerId !== activePointer) return;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      activePointer = null;
      isPanning = false;
      container.classList.remove('map-pan--grabbing');
    };

    container.addEventListener('pointerdown', onMouseDown);
    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);
    window.addEventListener('pointercancel', onMouseUp);

    return () => {
      container.classList.remove('map-pan-grabbable', 'map-pan--grabbing');
      container.removeEventListener('pointerdown', onMouseDown);
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
      window.removeEventListener('pointercancel', onMouseUp);
    };
  }, [map, enabled]);

  return null;
}
