/**
 * Siber anahtar — native checkbox yerine (AKTİF / KİLİTLİ veya neon X).
 */
export default function CyberToggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  lockedLabel = 'KİLİTLİ',
  activeLabel = 'AKTİF',
  showX = false,
  className = '',
  'aria-label': ariaLabel,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      className={[
        'cyber-toggle',
        checked && 'cyber-toggle--on',
        showX && !checked && 'cyber-toggle--x',
        disabled && 'cyber-toggle--disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      <span className="cyber-toggle__frame" aria-hidden="true">
        <span className="cyber-toggle__glyph">
          {showX && !checked ? '✕' : checked ? '◆' : '○'}
        </span>
      </span>
      {label != null && <span className="cyber-toggle__label">{label}</span>}
      <span className="cyber-toggle__state font-hud-data">
        {checked ? activeLabel : lockedLabel}
      </span>
    </button>
  );
}
