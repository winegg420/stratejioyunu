import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameDataReady } from './useGameDataReady';

/**
 * Eski: veri gelmezse geri yönlendirme döngüsü yapıyordu.
 * Artık yalnızca PageSessionGate / RequireAuth timeout UI kullanılır.
 */
export function useHydrationTimeout() {
  const { pathname } = useLocation();
  const ready = useGameDataReady();

  useEffect(() => {
    if (pathname === '/giris' || pathname === '/') return undefined;
    if (ready) return undefined;
    return undefined;
  }, [pathname, ready]);
}
