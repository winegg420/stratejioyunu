import { useEffect } from 'react';

/**
 * ESC ve isteğe bağlı overlay tıklaması ile modal kapatma.
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {{ enabled?: boolean }} [options]
 */
export function useModalDismiss(open, onClose, options = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!open || !enabled) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, enabled]);
}

export function stopModalPropagation(e) {
  e.stopPropagation();
}
