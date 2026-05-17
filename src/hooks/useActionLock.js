import { useCallback, useState } from 'react';

/** Spam tıklama — işlem bitene kadar butonu kilitle. */
export function useActionLock(cooldownMs = 450) {
  const [locked, setLocked] = useState(false);

  const runLocked = useCallback(
    (fn) => {
      if (locked) return undefined;
      const result = fn();
      if (result === false) return false;
      setLocked(true);
      window.setTimeout(() => setLocked(false), cooldownMs);
      return result;
    },
    [locked, cooldownMs],
  );

  return { locked, runLocked };
}
