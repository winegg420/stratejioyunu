import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import BuildingCard from '../components/BuildingCard';
import ActiveQueue from '../components/ActiveQueue';
import { getHqLevel } from '../lib/buildingUtils';
import {
  getProgressionState,
  isBuildingVisibleInStarterPhase,
} from '../lib/progressionSystem';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';

function scrollToBuildingFromHash(hash) {
  const buildingId = hash.replace(/^#/, '').trim();
  if (!buildingId) return;

  const el = document.getElementById(`building-card-${buildingId}`);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('building-card--focus');
  window.setTimeout(() => el.classList.remove('building-card--focus'), 2200);
}

export default function Buildings() {
  const { hash } = useLocation();
  const buildings = useGameStore((s) => s.cities[s.activeCityId]?.buildings ?? STORE_EMPTY_ARRAY);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name);
  const hqLevel = getHqLevel(city);
  const progression = getProgressionState(city);

  useEffect(() => {
    if (!hash) return undefined;
    const timer = window.setTimeout(() => scrollToBuildingFromHash(hash), 80);
    return () => window.clearTimeout(timer);
  }, [hash, buildings]);

  return (
    <div className="page page-wrapper buildings-page page--console">
      <PageHeader
        title="Binalar"
        subtitle="> İnşaat protokolü: tek aktif yükseltme · kuyruk modülü hazır..."
      />
      <ActiveQueue
        title={`Aktif Kuyruk — ${cityName}`}
        queueType="construction"
        emptyText="Şu an yükseltilen bina yok. Aşağıdan bir bina seçerek kuyruğa ekleyebilirsiniz."
      />
      <div className="buildings-grid card-grid">
        {buildings.map((b) => {
          const starterHidden = !isBuildingVisibleInStarterPhase(b.id, hqLevel);
          return (
            <BuildingCard
              key={b.id}
              building={b}
              progressionLock={starterHidden ? (progression.locks.advanced ?? 'Komuta Merkezi yükseltin') : null}
            />
          );
        })}
      </div>
    </div>
  );
}
