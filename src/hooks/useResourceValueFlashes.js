import { useEffect, useRef, useState } from 'react';

/**
 * Kaynak current değeri değiştiğinde kısa yeşil parlama (tick, Supabase, patchCity).
 */
function snapshotResources(resources) {
  if (!resources?.length) return '';
  return resources.map((r) => `${r.id}:${Math.floor(r.current ?? 0)}`).join('|');
}

export function useResourceValueFlashes(resources) {
  const prevKeyRef = useRef('');
  const [flashing, setFlashing] = useState({});
  const resourceKey = snapshotResources(resources);

  useEffect(() => {
    if (!resourceKey) {
      prevKeyRef.current = '';
      return undefined;
    }

    const prevKey = prevKeyRef.current;
    prevKeyRef.current = resourceKey;
    if (!prevKey || prevKey === resourceKey) return undefined;

    const prevMap = Object.fromEntries(
      prevKey.split('|').filter(Boolean).map((part) => {
        const [id, val] = part.split(':');
        return [id, Number(val)];
      }),
    );
    const nextMap = Object.fromEntries(
      resourceKey.split('|').filter(Boolean).map((part) => {
        const [id, val] = part.split(':');
        return [id, Number(val)];
      }),
    );

    const changed = {};
    for (const [id, val] of Object.entries(nextMap)) {
      if (prevMap[id] !== undefined && prevMap[id] !== val) {
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
  }, [resourceKey]);

  return flashing;
}
