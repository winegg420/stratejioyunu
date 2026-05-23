import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

function toDisplayValue(value) {
  if (value === '' || value == null) return '';
  return String(value);
}

/**
 * Askeri veri girişi — monospace miktar + neon MAX.
 * Odak kaybında değer sıfırlanmasını önlemek için yerel taslak + flushSync senkronizasyonu.
 */
export default function CyberDataInput({
  value,
  onChange,
  onValueChange,
  onMax,
  min = 0,
  max,
  disabled = false,
  className = '',
  inputClassName = '',
  placeholder = '',
}) {
  const [draft, setDraft] = useState(() => toDisplayValue(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(toDisplayValue(value));
    }
  }, [value]);

  const emitChange = useCallback(
    (nextValue) => {
      flushSync(() => {
        setDraft(nextValue);
        onChange?.({ target: { value: nextValue } });
        onValueChange?.(nextValue);
      });
    },
    [onChange, onValueChange],
  );

  const handleChange = (e) => {
    emitChange(e.target.value);
  };

  const handleFocus = () => {
    focusedRef.current = true;
  };

  const handleBlur = () => {
    focusedRef.current = false;
    const parentVal = toDisplayValue(value);
    if (draft !== parentVal) {
      flushSync(() => {
        onChange?.({ target: { value: draft } });
        onValueChange?.(draft);
      });
    }
    setDraft(toDisplayValue(value ?? draft));
  };

  const handleMaxClick = () => {
    if (!onMax) return;
    let synced;
    flushSync(() => {
      synced = onMax();
    });
    if (synced !== undefined) {
      setDraft(toDisplayValue(synced));
      return;
    }
    setDraft(toDisplayValue(value));
  };

  return (
    <div className={['cyber-data-input', className].filter(Boolean).join(' ')}>
      <input
        type={placeholder ? 'text' : 'number'}
        className={['cyber-data-input__field', 'input-qty', inputClassName].filter(Boolean).join(' ')}
        value={draft}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {onMax && (
        <button
          type="button"
          className="cyber-data-input__max"
          disabled={disabled}
          onClick={handleMaxClick}
          title="Maksimum miktar"
        >
          MAX
        </button>
      )}
    </div>
  );
}
