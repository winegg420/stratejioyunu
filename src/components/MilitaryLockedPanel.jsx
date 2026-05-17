import { Link } from 'react-router-dom';
import { useActiveCity } from '../stores/gameStore';
import { getBuildingById, isBuildingLocked } from '../lib/buildingUtils';

const BUILDING_LABELS = {
  barracks: 'Kışla',
  airport: 'Hava Üssü',
  shipyard: 'Tersane',
};

export default function MilitaryLockedPanel({ buildingId, children }) {
  const city = useActiveCity();
  const building = getBuildingById(city, buildingId);
  const locked = !building || isBuildingLocked(building);
  const label = BUILDING_LABELS[buildingId] ?? 'Bina';

  if (!locked) return children;

  return (
    <div className="military-locked-wrap">
      <div className="military-locked-banner">
        <span className="military-locked-icon" aria-hidden="true">🔒</span>
        <div>
          <strong>{label} kilitli</strong>
          <p>
            {label} henüz inşa edilmedi. Binalar sayfasından manuel olarak inşaatı başlattığınızda
            bu panel aktifleşir.
          </p>
          <Link to="/binalar" className="btn btn-primary btn-sm military-locked-link">
            Binalara Git
          </Link>
        </div>
      </div>
      <div className="military-locked-content" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
