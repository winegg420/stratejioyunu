import { useLocation, useNavigate } from 'react-router-dom';
import CustomDropdown from './CustomDropdown';
import { getMapCityDisplayName } from '../map/mapCityDisplayName';
import { useGameStore } from '../stores/gameStore';

export default function IntelTargetPicker({
  label = 'Hedef üs',
  value,
  onChange,
  targets,
  onMapPick,
  disabled,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const requestMapTargetPick = useGameStore((s) => s.requestMapTargetPick);

  const handleMapPick = () => {
    if (onMapPick) {
      onMapPick();
      return;
    }
    const returnPath = `${location.pathname}${location.search}`;
    requestMapTargetPick('agent', returnPath);
    navigate('/harita', { state: { mapPickField: 'agent', mapPickReturn: returnPath } });
  };

  const options = targets.length
    ? targets.map((t) => ({
      value: t.name,
      label: getMapCityDisplayName(t.name) || t.name,
    }))
    : [{ value: '', label: 'Hedef yok', disabled: true }];

  return (
    <div className="intel-target-picker">
      <span className="intel-target-picker__label">{label}</span>
      <div className="intel-target-picker__row">
        <CustomDropdown
          className="intel-target-picker__select"
          value={value}
          onChange={onChange}
          disabled={disabled || !targets.length}
          placeholder="Hedef seçin…"
          options={options}
          aria-label={label}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm intel-target-picker__map-btn"
          disabled={disabled}
          onClick={handleMapPick}
        >
          Haritadan Seç
        </button>
      </div>
    </div>
  );
}
