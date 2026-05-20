import { useEffect, useRef, useState } from 'react';

/**
 * Paragrafları sırayla typewriter ile yazar; paragraflar arası pauseMs bekler.
 */
export function useTypewriter(paragraphs, { charMs = 28, pauseMs = 520, active = true } = {}) {
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef([]);

  useEffect(() => {
    if (!active) return undefined;
    setParagraphIndex(0);
    setCharIndex(0);
    setDone(false);
    completedRef.current = [];
    return undefined;
  }, [active, paragraphs]);

  useEffect(() => {
    if (!active || !paragraphs?.length) {
      setDone(true);
      return undefined;
    }

    if (paragraphIndex >= paragraphs.length) {
      setDone(true);
      return undefined;
    }

    const current = paragraphs[paragraphIndex] ?? '';

    if (charIndex < current.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), charMs);
      return () => clearTimeout(t);
    }

    completedRef.current[paragraphIndex] = current;
    if (paragraphIndex + 1 >= paragraphs.length) {
      const t = window.setTimeout(() => setDone(true), pauseMs);
      return () => clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setParagraphIndex((p) => p + 1);
      setCharIndex(0);
    }, pauseMs);
    return () => clearTimeout(t);
  }, [active, paragraphs, paragraphIndex, charIndex, charMs, pauseMs]);

  const visibleCompleted = paragraphs
    .slice(0, paragraphIndex)
    .map((text, i) => completedRef.current[i] ?? text);

  const currentPartial = paragraphs[paragraphIndex]?.slice(0, charIndex) ?? '';

  return {
    visibleCompleted,
    currentPartial,
    paragraphIndex,
    done,
    isTyping: active && !done,
  };
}
