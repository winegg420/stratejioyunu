import { useCallback, useState } from 'react';

/** Spam tıklama — işlem bitene kadar butonu kilitle. */
export function useActionLock(cooldownMs = 450) {
  const [locked, setLocked] = useState(false);

  const runLocked = useCallback(
    (fn) => {
      if (locked) return undefined;
      setLocked(true);
      let result;
      try {
        result = fn();
      } finally {
        window.setTimeout(() => setLocked(false), cooldownMs);
      }
      return result;
    },
    [locked, cooldownMs],
  );

  return { locked, runLocked };
}
