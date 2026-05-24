import { useMemo } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import BattleSimulator from '../components/BattleSimulator';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { landUnits as landUnitDefs } from '../data/placeholder';
import { useActiveCityIdleTroops, useGameStore, useTroopsAwayMap } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

export default function Barracks() {
  const { t, unitName } = useLanguage();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId)?.name);
  const awayMap = useTroopsAwayMap(activeCityId);
  const troops = useActiveCityIdleTroops();
  const productionQueue = useGameStore((s) => s.cities[s.activeCityId]?.productionQueue ?? []);
  const productionQueueKey = productionQueue.map((q) => q.id).join('-') || 'empty';
  const landUnits = useMemo(
    () =>
      landUnitDefs.map((u) => {
        const t = troops.find((x) => x.id === u.id);
        const idle = t?.available ?? 0;
        const away = awayMap[u.id] || 0;
        return { ...u, count: idle + away, idle };
      }),
    [troops, awayMap],
  );

  return (
    <div className="page page--console barracks-page barracks-page--military">
      <LocalizedPageHeader pageKey="barracks" />
      <section className="barracks-production-section" aria-labelledby="barracks-production-heading">
        <h2 id="barracks-production-heading" className="barracks-section-title">
          {t('pages.barracks.productionSection')}
        </h2>
        <div className="card-grid barracks-production-grid">
          {landUnits.map((u) => (
            <LockedFeatureGate key={u.id} buildingId="barracks" featureName={unitName(u.id, u.name)}>
              <UnitCard
                unit={{ ...u, name: unitName(u.id, u.name) }}
                awayMap={awayMap}
                iconDomain="land"
              />
            </LockedFeatureGate>
          ))}
        </div>
      </section>
      <ActiveQueue
        key={productionQueueKey}
        title={t('pages.barracks.queueTitle', { city: cityName })}
        queueType="production"
        emptyText={t('pages.barracks.queueEmpty')}
      />
      <BattleSimulator />
    </div>
  );
}
