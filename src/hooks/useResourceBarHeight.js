import { useEffect, useRef } from 'react';

const SAFE_GAP_PX = 4;
const MIN_BAR_PX = 72;
const MAX_BAR_PX = 120;
const MIN_BAR_STACKED_PX = 96;
const MAX_BAR_STACKED_PX = 148;

/**
 * Üst kaynak çubuğunun gerçek yüksekliğini ölçer; --resource-bar-h ile kabuk senkronlar.
 */
export function useResourceBarHeight(deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let lastHeight = 0;
    let frame = 0;

    const sync = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const stacked = el.classList.contains('resource-bar--stacked');

        el.style.minHeight = '0';
        el.style.maxHeight = 'none';
        el.style.height = 'auto';

        const natural = Math.ceil(el.getBoundingClientRect().height);
        const h = stacked
          ? Math.max(MIN_BAR_STACKED_PX, Math.min(natural, MAX_BAR_STACKED_PX))
          : Math.max(MIN_BAR_PX, Math.min(natural, MAX_BAR_PX));

        if (h === lastHeight && el.dataset.barLayout === (stacked ? 'stacked' : 'single')) return;
        lastHeight = h;
        el.dataset.barLayout = stacked ? 'stacked' : 'single';

        document.documentElement.style.setProperty('--resource-bar-h', `${h + SAFE_GAP_PX}px`);

        if (stacked) {
          el.style.minHeight = `${h}px`;
          el.style.maxHeight = 'none';
          el.style.height = 'auto';
        } else {
          el.style.minHeight = `${h}px`;
          el.style.maxHeight = `${h}px`;
          el.style.height = `${h}px`;
        }
      });
    };

    sync();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync);
      ro.observe(el);
    }

    window.addEventListener('resize', sync);
    const fontsReady = document.fonts?.ready;
    if (fontsReady?.then) {
      fontsReady.then(sync).catch(() => {});
    }

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, deps);

  return ref;
}
