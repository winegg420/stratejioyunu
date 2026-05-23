import { useCallback, useRef, useState } from 'react';

/** Tek aktif async işlem — tamamlanana kadar kilit. */
export function useAsyncActionLock() {
  const busyRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const runLocked = useCallback(async (fn) => {
    if (busyRef.current) return undefined;
    busyRef.current = true;
    setLocked(true);
    try {
      return await fn();
    } finally {
      busyRef.current = false;
      setLocked(false);
    }
  }, []);

  return { locked, runLocked };
}

/** Anahtarlı async kilit — Market gibi çoklu butonlar için. */
export function useKeyedAsyncLock() {
  const busyRef = useRef(null);
  const [activeKey, setActiveKey] = useState(null);

  const runLocked = useCallback(async (key, fn) => {
    if (busyRef.current) return undefined;
    busyRef.current = key;
    setActiveKey(key);
    try {
      return await fn();
    } finally {
      busyRef.current = null;
      setActiveKey(null);
    }
  }, []);

  const isProcessing = useCallback((key) => activeKey === key, [activeKey]);

  return {
    activeKey,
    isBusy: activeKey != null,
    isProcessing,
    runLocked,
  };
}
