import { useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

function formatServerTime(now) {
  const d = new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function ServerTimeClock() {
  const now = useGameStore((s) => s.now);
  const { t } = useLanguage();

  return (
    <div
      className="server-time-clock server-time-clock--terminal server-time-clock--bar"
      title={t('resourceBar.serverTimeTitle')}
    >
      <span className="server-time-label">{t('resourceBar.serverTimeLabel')}</span>
      <time className="server-time-value" dateTime={new Date(now).toISOString()}>
        {formatServerTime(now)}
      </time>
    </div>
  );
}
