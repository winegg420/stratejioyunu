import { useEffect, useRef } from 'react';

/** Unmount sonrası setState / async güncellemelerini engelle */
export function useMountedRef() {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

export function useSafeAsyncSetter(setter, mountedRef) {
  return (...args) => {
    if (mountedRef.current) setter(...args);
  };
}
