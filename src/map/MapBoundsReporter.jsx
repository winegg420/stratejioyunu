import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { clampLatLngBounds } from './turkeyBounds';

function viewportSignature(vp) {
  if (!vp) return '';
  const b = vp.bounds;
  const c = vp.center;
  return [
    vp.zoom,
    c.lat.toFixed(5),
    c.lng.toFixed(5),
    b.getNorth().toFixed(5),
    b.getSouth().toFixed(5),
    b.getEast().toFixed(5),
    b.getWest().toFixed(5),
  ].join('|');
}

export default function MapBoundsReporter({ onViewportChange }) {
  const map = useMap();
  const onChangeRef = useRef(onViewportChange);
  const lastSigRef = useRef('');

  useEffect(() => {
    onChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    const report = () => {
      if (map._animatingZoom) return;
      const next = {
        bounds: clampLatLngBounds(map.getBounds()),
        center: map.getCenter(),
        zoom: map.getZoom(),
      };
      const sig = viewportSignature(next);
      if (sig === lastSigRef.current) return;
      lastSigRef.current = sig;
      onChangeRef.current(next);
    };
    const onUserMove = () => {
      if (map.dragging?.moved?.()) report();
    };
    map.on('zoomend', report);
    map.on('dragend', onUserMove);
    report();
    return () => {
      map.off('zoomend', report);
      map.off('dragend', onUserMove);
    };
  }, [map]);

  return null;
}
