const DEFAULT_LOCK_MSG = '[ YETERSİZ ERİŞİM SEVİYESİ ]';

export default function IntelOpActionButton({
  disabled = false,
  locked = false,
  lockMessage = DEFAULT_LOCK_MSG,
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  const isLocked = locked || disabled;
  const variantClass = variant === 'danger' ? 'intel-op-btn--danger' : 'intel-op-btn--primary';

  return (
    <span
      className={[
        'intel-op-btn-wrap',
        isLocked && 'intel-op-btn-wrap--locked',
      ].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className={[
          'intel-op-btn',
          variantClass,
          className,
        ].filter(Boolean).join(' ')}
        disabled={isLocked}
        aria-disabled={isLocked}
        {...rest}
      >
        {children}
      </button>
      {isLocked && (
        <span className="intel-op-btn__tooltip" role="tooltip">
          {lockMessage}
        </span>
      )}
    </span>
  );
}
