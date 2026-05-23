import { useCallback, useEffect, useRef, useState } from 'react';

function paragraphsKey(paragraphs) {
  if (!paragraphs?.length) return '';
  return paragraphs.join('\u0001');
}

/**
 * Paragrafları sırayla typewriter ile yazar.
 */
export function useTypewriter(paragraphs, { charMs = 28, pauseMs = 520, active = true } = {}) {
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef([]);
  const paragraphsRef = useRef(paragraphs);
  paragraphsRef.current = paragraphs;
  const stableKey = paragraphsKey(paragraphs);

  useEffect(() => {
    if (!active) return undefined;
    setParagraphIndex(0);
    setCharIndex(0);
    setDone(false);
    completedRef.current = [];
    return undefined;
  }, [active, stableKey]);

  useEffect(() => {
    const list = paragraphsRef.current;
    if (!active || !list?.length) {
      setDone(true);
      return undefined;
    }

    if (paragraphIndex >= list.length) {
      setDone(true);
      return undefined;
    }

    const current = list[paragraphIndex] ?? '';

    if (charIndex < current.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), charMs);
      return () => clearTimeout(t);
    }

    completedRef.current[paragraphIndex] = current;
    if (paragraphIndex + 1 >= list.length) {
      const t = window.setTimeout(() => setDone(true), pauseMs);
      return () => clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setParagraphIndex((p) => p + 1);
      setCharIndex(0);
    }, pauseMs);
    return () => clearTimeout(t);
  }, [active, stableKey, paragraphIndex, charIndex, charMs, pauseMs]);

  const skipToEnd = useCallback(() => {
    const list = paragraphsRef.current ?? [];
    if (!list.length) {
      setDone(true);
      return;
    }
    completedRef.current = [...list];
    setParagraphIndex(list.length);
    setCharIndex(0);
    setDone(true);
  }, []);

  const list = paragraphs ?? [];
  const visibleCompleted = done
    ? list
    : list
      .slice(0, paragraphIndex)
      .map((text, i) => completedRef.current[i] ?? text);

  const currentPartial = done ? '' : (list[paragraphIndex]?.slice(0, charIndex) ?? '');

  return {
    visibleCompleted,
    currentPartial,
    paragraphIndex,
    done,
    isTyping: active && !done,
    skipToEnd,
  };
}
