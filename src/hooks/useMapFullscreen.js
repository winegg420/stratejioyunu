import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAP_FS_ROOT_CLASS,
  MAP_PSEUDO_FS_CLASS,
  releaseMapSessionLocks,
} from '../map/mapRouteCleanup';

const FS_ROOT_CLASS = MAP_FS_ROOT_CLASS;

function isFullscreenElement(el) {
  return document.fullscreenElement === el
    || document.webkitFullscreenElement === el;
}

export function useMapFullscreen() {
  const theaterRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncState = useCallback(() => {
    const el = theaterRef.current;
    const active = Boolean(el && isFullscreenElement(el));
    setIsFullscreen(active);
    document.documentElement.classList.toggle(FS_ROOT_CLASS, active);
  }, []);

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
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    const el = theaterRef.current;
    if (el?.classList.contains(MAP_PSEUDO_FS_CLASS)) {
      el.classList.remove(MAP_PSEUDO_FS_CLASS);
      setIsFullscreen(false);
      document.documentElement.classList.remove(FS_ROOT_CLASS);
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
