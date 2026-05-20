import { useEffect } from 'react';

const SCROLL_ALLOW_SELECTORS = [
  '.content-area',
  '.leaflet-container',
  '.unit-detail-modal',
  '.system-locked-panel',
  '.city-detail-panel',
  '.report-detail--ledger',
  '.map-city-select',
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
