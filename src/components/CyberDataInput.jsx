import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { toRawInputNumber } from '../lib/formatNumber';

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
  onBlur,
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

  const handleBlur = (e) => {
    focusedRef.current = false;
    const parentVal = toDisplayValue(value);
    if (draft !== parentVal) {
      flushSync(() => {
        onChange?.({ target: { value: draft } });
        onValueChange?.(draft);
      });
    }
    setDraft(toDisplayValue(value ?? draft));
    onBlur?.(e);
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

  const handleKeyDown = (e) => {
    if (disabled || placeholder) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const floor = min ?? 0;
    const current = Math.floor(Number(toRawInputNumber(draft) || 0));
    let next = e.key === 'ArrowUp' ? current + step : current - step;
    next = Math.max(floor, next);
    if (max != null && Number.isFinite(max)) next = Math.min(max, next);
    emitChange(String(next));
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
        step={placeholder ? undefined : 1}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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
