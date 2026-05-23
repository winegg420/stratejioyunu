import { useSafeBack } from '../hooks/useSafeBack';

export default function HudBackButton({
  onStepBack,
  fallback,
  className = 'btn btn-secondary btn-sm hud-back-btn',
  label = 'Geri',
  ariaLabel = 'Bir adım geri',
  ...rest
}) {
  const handleBack = useSafeBack({ onStepBack, fallback });

  return (
    <button
      type="button"
      className={className}
      onClick={handleBack}
      aria-label={ariaLabel}
      {...rest}
    >
      <span className="hud-back-btn__arrow" aria-hidden="true">←</span>
      {label}
    </button>
  );
}
