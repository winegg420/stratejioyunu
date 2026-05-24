import { useEffect, useState } from 'react';
import { formatReadableDuration } from '../lib/gameUtils';
import { useLanguage } from '../context/LanguageContext';

const SPINNER_FRAMES = ['|', '/', '-', '\\'];

export default function BuildCountdownHud({ remaining }) {
  const { lang } = useLanguage();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const iv = window.setInterval(() => {
      setFrame((n) => (n + 1) % SPINNER_FRAMES.length);
    }, 180);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <div className="build-countdown-hud" role="status">
      <span className="build-countdown-hud__spinner font-hud-data" aria-hidden="true">
        {SPINNER_FRAMES[frame]}
      </span>
      <span className="build-countdown-hud__time font-hud-data">
        {formatReadableDuration(remaining, lang)}
      </span>
    </div>
  );
}
