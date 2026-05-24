import { useEffect } from 'react';

const SCROLL_ALLOW_SELECTORS = [
  '.content-area',
  '.leaflet-container',
  '.content-info-modal',
  '.system-locked-panel',
  '.city-detail-panel',
  '.map-command-modal-root',
  '.map-command-modal',
  '.map-command-modal__panel',
  '.report-detail--ledger',
  '.map-city-select',
  '.map-intel-sidebar',
  '.tactical-console',
  '.tactical-console__body',
  '.input-qty',
  'textarea',
  'select',
];

function canScrollTarget(target) {
  if (!(target instanceof Element)) return false;
  let el = target;
  while (el) {
    for (const sel of SCROLL_ALLOW_SELECTORS) {
      if (el.matches?.(sel) || el.closest?.(sel)) return true;
    }
    if (el.classList?.contains('content-area')) return true;
    const style = window.getComputedStyle(el);
    if (
      (style.overflowY === 'auto' || style.overflowY === 'scroll')
      && el.scrollHeight > el.clientHeight + 1
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function useMobileScrollGuard(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onTouchMove = (event) => {
      if (canScrollTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', onTouchMove);
  }, [enabled]);
}
