import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAP_FS_ROOT_CLASS,
  MAP_PSEUDO_FS_CLASS,
  releaseMapSessionLocks,
} from '../map/mapRouteCleanup';

const FS_ROOT_CLASS = MAP_FS_ROOT_CLASS;

function pulseMapLayout() {
  window.dispatchEvent(new Event('map-layout-changed'));
  [0, 60, 150, 320, 600].forEach((ms) => {
    window.setTimeout(() => window.dispatchEvent(new Event('map-layout-changed')), ms);
  });
}

function isFullscreenElement(el) {
  return document.fullscreenElement === el
    || document.webkitFullscreenElement === el;
}

export function useMapFullscreen({ pageScrollSnapshotRef } = {}) {
  const theaterRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const restorePageScroll = useCallback(() => {
    const snap = pageScrollSnapshotRef?.current;
    const content = document.querySelector('.app-shell.route-map .content-area');
    if (snap) {
      window.scrollTo({ top: snap.windowY ?? 0, left: 0, behavior: 'instant' });
      if (content != null && snap.contentTop != null) content.scrollTop = snap.contentTop;
      return;
    }
    if (content) content.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pageScrollSnapshotRef]);

  const syncState = useCallback(() => {
    const el = theaterRef.current;
    const active = Boolean(el && isFullscreenElement(el));
    const wasActive = document.documentElement.classList.contains(FS_ROOT_CLASS);
    setIsFullscreen(active);
    document.documentElement.classList.toggle(FS_ROOT_CLASS, active);
    if (wasActive && !active) {
      document.body.classList.remove('map-scroll-locked');
      restorePageScroll();
    }
    requestAnimationFrame(pulseMapLayout);
  }, [restorePageScroll]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncState);
    document.addEventListener('webkitfullscreenchange', syncState);
    return () => {
      document.removeEventListener('fullscreenchange', syncState);
      document.removeEventListener('webkitfullscreenchange', syncState);
      releaseMapSessionLocks();
    };
  }, [syncState]);

  const enterFullscreen = useCallback(async () => {
    const el = theaterRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      el.classList.add(MAP_PSEUDO_FS_CLASS);
      setIsFullscreen(true);
      document.documentElement.classList.add(FS_ROOT_CLASS);
      pulseMapLayout();
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    const el = theaterRef.current;
    if (el?.classList.contains(MAP_PSEUDO_FS_CLASS)) {
      el.classList.remove(MAP_PSEUDO_FS_CLASS);
      setIsFullscreen(false);
      document.documentElement.classList.remove(FS_ROOT_CLASS);
      document.body.classList.remove('map-scroll-locked');
      restorePageScroll();
      pulseMapLayout();
      return;
    }
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    theaterRef,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
