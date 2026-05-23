import LocalizedPageHeader from '../components/LocalizedPageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { airUnits } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

export default function Airbase() {
  const { t, unitName } = useLanguage();
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name);

  return (
    <div className="page page--console barracks-page barracks-page--military airbase-page--military">
      <LocalizedPageHeader pageKey="airbase" />
      <ActiveQueue
        title={t('pages.airbase.queueTitle', { city: cityName ?? t('common.cityFallback') })}
        queueType="production"
        emptyText={t('pages.airbase.queueEmpty')}
      />
      <div className="card-grid">
        {airUnits.map((u) => (
          <LockedFeatureGate key={u.id} buildingId="airport" featureName={unitName(u.id, u.name)}>
            <UnitCard unit={{ ...u, name: unitName(u.id, u.name) }} />
          </LockedFeatureGate>
        ))}
      </div>
    </div>
  );
}
