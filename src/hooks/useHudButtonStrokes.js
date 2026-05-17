import { useEffect } from 'react';
import { mountHudButtonChrome } from '../components/HudButtonChrome';

function syncHudButtonStrokes(root) {
  root.querySelectorAll('.btn').forEach((btn) => mountHudButtonChrome(btn));
}

/** Tüm HUD butonlarına ölçeklenebilir SVG stroke katmanı monte eder. */
export function useHudButtonStrokes() {
  useEffect(() => {
    const root = document.querySelector('.hud-shell');
    if (!root) return undefined;

    syncHudButtonStrokes(root);

    const observer = new MutationObserver(() => {
      syncHudButtonStrokes(root);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled'],
    });

    return () => observer.disconnect();
  }, []);
}
