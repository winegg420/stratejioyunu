import { Link } from 'react-router-dom';
import { useActiveCity } from '../stores/gameStore';
import {
  BUILDING_LABELS,
  getBuildingById,
  isBuildingLocked,
} from '../lib/buildingUtils';

export default function LockedFeatureGate({ buildingId, children, featureName, hideHint = false }) {
  const city = useActiveCity();
  const building = getBuildingById(city, buildingId);
  const locked = !building || isBuildingLocked(building);
  const label = BUILDING_LABELS[buildingId] ?? 'Bina';

  if (!locked) return children;

  return (
    <div className="locked-feature-gate">
      {children}
      <Link
        to={`/binalar#${buildingId}`}
        className="locked-feature-gate__overlay"
        aria-label={`${label} inşa et`}
      />
      {!hideHint && (
        <p className="locked-feature-gate__hint">
          <span className="locked-feature-gate__lock" aria-hidden="true">🔒</span>
          <strong>{featureName}</strong> için önce{' '}
          <Link to={`/binalar#${buildingId}`} className="locked-feature-gate__link">
            {label}
          </Link>{' '}
          inşa edilmeli (Binalar → İnşa Et). Birlik bilgisi için görsele tıklayın.
        </p>
      )}
    </div>
  );
}
