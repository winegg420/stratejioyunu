export default function IntelTargetPicker({
  label = 'Hedef üs',
  value,
  onChange,
  targets,
  onMapPick,
  disabled,
}) {
  return (
    <div className="intel-target-picker">
      <span className="intel-target-picker__label">{label}</span>
      <div className="intel-target-picker__row">
        <select
          className="intel-target-picker__select"
          value={value}
          disabled={disabled || !targets.length}
          onChange={(e) => onChange(e.target.value)}
        >
          {!targets.length ? (
            <option value="">Hedef yok</option>
          ) : (
            targets.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
                {t.status === 'bot' ? ' [BOT]' : ''}
                {t.owner ? ` — ${t.owner}` : ''}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          className="btn btn-secondary btn-sm intel-target-picker__map-btn"
          disabled={disabled}
          onClick={onMapPick}
        >
          Haritadan Seç
        </button>
      </div>
    </div>
  );
}
