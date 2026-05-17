import { useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import UnitCard from '../components/UnitCard';
import ActiveQueue from '../components/ActiveQueue';
import BattleSimulator from '../components/BattleSimulator';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { landUnits as landUnitDefs } from '../data/placeholder';
import { useGameStore, useTroopsAwayMap } from '../stores/gameStore';

export default function Barracks() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId)?.name);
  const awayMap = useTroopsAwayMap(activeCityId);
  const troops = useGameStore((s) => s.cities[s.activeCityId]?.idleTroops ?? []);
  useGameStore((s) => s.expeditions);
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
    <div className="page">
      <PageHeader title="Kışla" subtitle="Kara birlikleri — Kışla inşa edildikten sonra üretilir." />
      <ActiveQueue
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
