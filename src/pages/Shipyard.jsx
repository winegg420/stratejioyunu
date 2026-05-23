import LocalizedPageHeader from '../components/LocalizedPageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { seaUnits } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

export default function Shipyard() {
  const { t, unitName } = useLanguage();
  const activeCity = useGameStore((s) =>
    s.playerCities.find((c) => c.id === s.activeCityId),
  );
  const isCoastal = (activeCity?.type ?? '').includes('Kıyı')
    || (activeCity?.type ?? '').toLowerCase().includes('coast');

  return (
    <div className="page page--console barracks-page barracks-page--military shipyard-page--military">
      <LocalizedPageHeader pageKey="shipyard" />
      {!isCoastal ? (
        <MilitaryEmptyState
          variant="panel"
          tag={t('pages.shipyard.coastalTag')}
          icon="🌊"
          title={t('pages.shipyard.coastalTitle')}
          hint={t('pages.shipyard.coastalHint')}
        />
      ) : (
        <>
          <ActiveQueue
            title={t('pages.shipyard.queueTitle', { city: activeCity?.name ?? t('common.cityFallback') })}
            queueType="production"
            emptyText={t('pages.shipyard.queueEmpty')}
          />
          <div className="card-grid">
            {seaUnits.map((u) => (
              <LockedFeatureGate key={u.id} buildingId="shipyard" featureName={unitName(u.id, u.name)}>
                <UnitCard unit={{ ...u, name: unitName(u.id, u.name) }} />
              </LockedFeatureGate>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
