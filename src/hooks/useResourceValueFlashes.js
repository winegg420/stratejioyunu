import { useEffect, useRef, useState } from 'react';

/**
 * Kaynak current değeri değiştiğinde kısa yeşil parlama (tick, Supabase, patchCity).
 */
export function useResourceValueFlashes(resources) {
  const prevRef = useRef(null);
  const [flashing, setFlashing] = useState({});

  useEffect(() => {
    if (!resources?.length) {
      prevRef.current = null;
      return undefined;
    }

    const snapshot = Object.fromEntries(
      resources.map((r) => [r.id, Math.floor(r.current ?? 0)]),
    );
    const prev = prevRef.current;
    prevRef.current = snapshot;

    if (!prev) return undefined;

    const changed = {};
    for (const r of resources) {
      const id = r.id;
      if (prev[id] !== undefined && prev[id] !== snapshot[id]) {
        changed[id] = true;
      }
    }

    if (!Object.keys(changed).length) return undefined;

    setFlashing((f) => ({ ...f, ...changed }));
    const timer = window.setTimeout(() => {
      setFlashing((f) => {
        const next = { ...f };
        for (const id of Object.keys(changed)) delete next[id];
        return next;
      });
    }, 420);

    return () => window.clearTimeout(timer);
  }, [resources]);

  return flashing;
}
