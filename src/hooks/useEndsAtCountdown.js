import { useEffect, useState } from 'react';
import { formatSeconds } from '../lib/gameUtils';

/**
 * Bitiş zamanına göre geri sayım — her tick'te Date.now() ile fark hesaplanır.
 * Sekme arka plandayken setInterval yavaşlasa bile görünür olunca sapma düzeltilir.
 */
export function useEndsAtCountdown(endsAtMs) {
  const [, setPulse] = useState(0);

  useEffect(() => {
    if (endsAtMs == null || Number.isNaN(endsAtMs)) return undefined;

    const pulse = () => setPulse((n) => n + 1);

    const id = window.setInterval(pulse, 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') pulse();
    };
    document.addEventListener('visibilitychange', onVisibility);
    pulse();

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [endsAtMs]);

  if (endsAtMs == null || Number.isNaN(endsAtMs)) {
    return {
      remainingMs: 0,
      remainingSec: 0,
      isComplete: true,
      label: formatSeconds(0),
    };
  }

  const remainingMs = Math.max(0, endsAtMs - Date.now());
  const remainingSec = Math.ceil(remainingMs / 1000);

  return {
    remainingMs,
    remainingSec,
    isComplete: remainingMs <= 0,
    label: formatSeconds(remainingSec),
  };
}
