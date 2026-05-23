const PROCESSING_LABEL = 'PROCESSING...';

/**
 * İstek süresince disabled + PROCESSING... + pulse.
 */
export default function ProcessingActionButton({
  processing = false,
  processingLabel = PROCESSING_LABEL,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || processing}
      className={[
        className,
        processing && 'btn-hud-loading btn-hud-processing',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-busy={processing || undefined}
    >
      {processing ? processingLabel : children}
    </button>
  );
}
