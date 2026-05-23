import { Link } from 'react-router-dom';
import { useActiveCity } from '../stores/gameStore';
import {
  getBuildingById,
  isBuildingLocked,
} from '../lib/buildingUtils';
import { useLanguage } from '../context/LanguageContext';

/** Kilitli birim/ozellik — soluk kart, hover'da gereksinim */
export default function LockedFeatureGate({
  buildingId,
  children,
  featureName,
  hideHint = false,
}) {
  const { t, buildingLabel } = useLanguage();
  const city = useActiveCity();
  const building = getBuildingById(city, buildingId);
  const locked = !building || isBuildingLocked(building);
  const label = buildingLabel(buildingId, t('common.buildingFallback'));

  if (!locked) return children;

  const hint = t('components.featureGate.mustBuild', { feature: featureName, building: label });

  return (
    <div className="locked-feature-gate locked-feature-gate--soft" role="status">
      <div className="locked-feature-gate__content locked-feature-gate__content--soft" aria-hidden="true">
        {children}
      </div>
      <div className="locked-feature-gate__hover-tip">
        <span className="locked-feature-gate__hover-icon" aria-hidden="true">🔒</span>
        <p className="locked-feature-gate__hover-text">{hint}</p>
        {!hideHint && (
          <Link
            to={`/binalar#${buildingId}`}
            className="locked-feature-gate__hover-link"
          >
            {t('components.featureGate.goBuild')}
          </Link>
        )}
      </div>
    </div>
  );
}
