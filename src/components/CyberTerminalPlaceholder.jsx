const VARIANTS = {
  standby: {
    text: '[ SİSTEM BEKLEMEDE — EMİR BEKLENİYOR ]',
    icon: '▌',
  },
  scan: {
    text: '[ VERİ AKIŞI YOK — SİSTEM TARANIYOR... ]',
    icon: '◈',
  },
};

/**
 * Siber-askeri boş durum satırı — kuyruk, üretim ve terminal logları.
 */
export default function CyberTerminalPlaceholder({ variant = 'standby', className = '' }) {
  const row = VARIANTS[variant] ?? VARIANTS.standby;
  return (
    <p
      className={['cyber-terminal-placeholder', `cyber-terminal-placeholder--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      <span className="cyber-terminal-placeholder__icon" aria-hidden="true">
        {row.icon}
      </span>
      <span className="cyber-terminal-placeholder__text font-hud-data">{row.text}</span>
    </p>
  );
}
