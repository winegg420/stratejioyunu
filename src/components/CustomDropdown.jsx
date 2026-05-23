import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * @typedef {{ value: string, label: string, disabled?: boolean }} DropdownOption
 */

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  className = '',
  id: idProp,
  'aria-label': ariaLabel,
}) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t('common.select');
  const autoId = useId();
  const id = idProp ?? autoId;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? (value ? String(value) : resolvedPlaceholder);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const pick = (next) => {
    if (disabled) return;
    onChange(next);
    close();
  };

  return (
    <div
      ref={rootRef}
      className={[
        'custom-dropdown',
        open && 'custom-dropdown--open',
        disabled && 'custom-dropdown--disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        id={id}
        className="custom-dropdown__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={`custom-dropdown__value${!selected && !value ? ' custom-dropdown__value--placeholder' : ''}`}>
          {displayLabel}
        </span>
        <span className="custom-dropdown__chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <ul className="custom-dropdown__menu" role="listbox" aria-labelledby={id}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value || `opt-${opt.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  className={[
                    'custom-dropdown__option',
                    isSelected && 'custom-dropdown__option--selected',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => !opt.disabled && pick(opt.value)}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
