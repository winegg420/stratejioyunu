import { useEffect, useState } from 'react';

export default function TypewriterSubtitle({ text, className = '' }) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplay('');
      setDone(true);
      return undefined;
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

  return (
    <p className={['page-subtitle', 'page-subtitle--typewriter', className].filter(Boolean).join(' ')}>
      {display}
      {!done && <span className="page-subtitle__cursor" aria-hidden="true">▌</span>}
    </p>
  );
}
