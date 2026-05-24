import { useMemo } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { airUnits as airUnitDefs } from '../data/placeholder';
import { STORE_EMPTY_ARRAY, useActiveCityIdleTroops, useGameStore, useTroopsAwayMap } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

export default function Airbase() {
  const { t, unitName } = useLanguage();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId)?.name);
  const awayMap = useTroopsAwayMap(activeCityId);
  const troops = useActiveCityIdleTroops();
  const productionQueue = useGameStore((s) => s.cities[s.activeCityId]?.productionQueue ?? STORE_EMPTY_ARRAY);
  const productionQueueKey = productionQueue.map((q) => q.id).join('-') || 'empty';

  const airUnits = useMemo(
    () =>
      airUnitDefs.map((u) => {
        const troop = troops.find((x) => x.id === u.id);
        const idle = troop?.available ?? 0;
        const away = awayMap[u.id] || 0;
        return { ...u, count: idle + away, idle };
      }),
    [troops, awayMap],
  );

  return (
    <div className="page page--console barracks-page barracks-page--military airbase-page--military">
      <LocalizedPageHeader pageKey="airbase" />
      <ActiveQueue
        key={productionQueueKey}
        title={t('pages.airbase.queueTitle', { city: cityName ?? t('common.cityFallback') })}
        queueType="production"
        emptyText={t('pages.airbase.queueEmpty')}
      />
      <section className="barracks-production-section" aria-labelledby="airbase-production-heading">
        <h2 id="airbase-production-heading" className="barracks-section-title">
          {t('pages.airbase.productionSection')}
        </h2>
        <div className="card-grid airbase-production-grid">
          {airUnits.map((u) => (
            <LockedFeatureGate key={u.id} buildingId="airport" featureName={unitName(u.id, u.name)}>
              <UnitCard
                unit={{ ...u, name: unitName(u.id, u.name) }}
                awayMap={awayMap}
                iconDomain="air"
              />
            </LockedFeatureGate>
          ))}
        </div>
      </section>
    </div>
  );
}
