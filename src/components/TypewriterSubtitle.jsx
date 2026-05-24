import { useEffect, useState } from 'react';

function cacheKeyFor(text) {
  return `strateji:tw:${text?.slice(0, 120) ?? ''}`;
}

function readCachedState(text) {
  if (!text) return { display: '', done: true };
  try {
    if (sessionStorage.getItem(cacheKeyFor(text)) === '1') {
      return { display: text, done: true };
    }
  } catch {
    /* ignore */
  }
  return { display: '', done: false };
}

export default function TypewriterSubtitle({ text, className = '' }) {
  const [display, setDisplay] = useState(() => readCachedState(text).display);
  const [done, setDone] = useState(() => readCachedState(text).done);

  useEffect(() => {
    if (!text) {
      setDisplay('');
      setDone(true);
      return undefined;
    }

    const cacheKey = cacheKeyFor(text);
    try {
      if (sessionStorage.getItem(cacheKey) === '1') {
        setDisplay(text);
        setDone(true);
        return undefined;
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    let i = 0;
    let timeoutId = null;

    const tick = () => {
      if (cancelled) return;
      i += 1;
      setDisplay(text.slice(0, i));
      if (i < text.length) {
        timeoutId = window.setTimeout(tick, 24);
      } else {
        setDone(true);
        try {
          sessionStorage.setItem(cacheKey, '1');
        } catch {
          /* ignore */
        }
      }
    };

    setDisplay('');
    setDone(false);
    timeoutId = window.setTimeout(tick, 100);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [text]);

  if (!text) return null;

  const showCursor = !done && display.length > 0;

  return (
    <p
      className={[
        'page-subtitle',
        'page-subtitle--typewriter',
        done && 'page-subtitle--typewriter-done',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-busy={!done}
    >
      {display}
      {showCursor ? <span className="page-subtitle__cursor" aria-hidden="true">▌</span> : null}
    </p>
  );
}
