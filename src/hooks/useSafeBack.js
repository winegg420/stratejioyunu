import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Bir adım geri: önce üst bileşen state'i, sonra tarayıcı geçmişi, en son isteğe bağlı fallback.
 * Ana dashboard'a (/) zorla yönlendirmez.
 */
export function useSafeBack({ onStepBack, fallback } = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (typeof onStepBack === 'function') {
      onStepBack();
      return;
    }

    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
      return;
    }

    if (fallback && fallback !== location.pathname) {
      navigate(fallback);
    }
  }, [navigate, onStepBack, fallback, location.pathname]);
}
