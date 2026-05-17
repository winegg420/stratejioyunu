import { useEffect, useRef, useState } from 'react';

function parseTime(str) {
  if (!str || str === '—') return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function useCountdownProgress(initialTimeStr) {
  const totalRef = useRef(parseTime(initialTimeStr));
  const [seconds, setSeconds] = useState(() => parseTime(initialTimeStr));

  useEffect(() => {
    const total = parseTime(initialTimeStr);
    totalRef.current = total;
    setSeconds(total);
  }, [initialTimeStr]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const total = totalRef.current;
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0;

  return {
    display: seconds > 0 ? formatTime(seconds) : '—',
    seconds,
    total,
    progress,
    active: seconds > 0,
  };
}
