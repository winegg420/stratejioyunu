import { useMemo } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import BattleSimulator from '../components/BattleSimulator';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { landUnits as landUnitDefs } from '../data/placeholder';
import { useActiveCityIdleTroops, useGameStore, useTroopsAwayMap } from '../stores/gameStore';

export default function Barracks() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId)?.name);
  const awayMap = useTroopsAwayMap(activeCityId);
  const troops = useActiveCityIdleTroops();
  const idleAgents = useGameStore((s) => s.cities[s.activeCityId]?.idleAgents ?? 0);
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
      <LocalizedPageHeader
        pageKey="barracks"
        action={(
          <span className="barracks-agent-counter" title="İstihbarat ve siber virüs operasyonları">
            Mevcut / Boşta Ajan: <strong>{idleAgents}</strong>
            <span className="barracks-agent-hint"> (keşif + siber)</span>
          </span>
        )}
      />
      <ActiveQueue
        key={productionQueueKey}
        title={`Aktif Kuyruk — ${cityName}`}
        queueType="production"
        emptyText="Üretim kuyruğu boş. Bir birlik seçip üretim başlatabilirsiniz."
      />
      <BattleSimulator />
      <div className="card-grid">
        {landUnits.map((u) => (
          <LockedFeatureGate key={u.id} buildingId="barracks" featureName={u.name}>
            <UnitCard unit={u} awayMap={awayMap} />
          </LockedFeatureGate>
        ))}
      </div>
    </div>
  );
}
