import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import BuildingCard from '../components/BuildingCard';
import ActiveQueue from '../components/ActiveQueue';
import EmpireSlotBanner from '../components/EmpireSlotBanner';
import PopulationDistributionPanel from '../components/PopulationDistributionPanel';
import { getHqLevel, syncCityBuildingsToCatalog } from '../lib/buildingUtils';
import {
  getProgressionState,
  isBuildingVisibleInStarterPhase,
} from '../lib/progressionSystem';
import { isCoastalPlayerCity, getConstructionQueueSummary } from '../lib/cityManagementUi';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const { hash } = useLocation();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const activePlayerCity = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId));
  const buildings = useMemo(
    () => syncCityBuildingsToCatalog(city?.buildings ?? STORE_EMPTY_ARRAY),
    [city?.buildings],
  );
  const cityName = activePlayerCity?.name;
  const hqLevel = getHqLevel(city);
  const progression = getProgressionState(city);
  const coastal = isCoastalPlayerCity(activePlayerCity);
  const queueSummary = getConstructionQueueSummary(city);

  useEffect(() => {
    if (!hash) return undefined;
    const timer = window.setTimeout(() => scrollToBuildingFromHash(hash), 80);
    return () => window.clearTimeout(timer);
  }, [hash, buildings]);

  return (
    <div className="page page-wrapper buildings-page page--console">
      <EmpireSlotBanner />
      <div className="buildings-page__toolbar">
        <span className="buildings-queue-badge font-hud-data" title={t('cityManagement.queueToolbarTitle')}>
          {t('cityManagement.queueActive', { active: queueSummary.activeCount })}
          {' · '}
          {t('cityManagement.queueTotal', { total: queueSummary.total, limit: queueSummary.limit })}
        </span>
      </div>
      <LocalizedPageHeader pageKey="buildings" />
      <ActiveQueue
        title={`Aktif Kuyruk — ${cityName}`}
        queueType="construction"
        emptyText="Şu an yükseltilen bina yok. Aşağıdan bir bina seçerek kuyruğa ekleyebilirsiniz."
      />
      <div className="buildings-page__grid-wrap">
        <div className="buildings-grid card-grid">
          {buildings.map((b) => {
            const starterHidden = !isBuildingVisibleInStarterPhase(b.id, hqLevel);
            const coastalLocked = b.id === 'shipyard' && !coastal;
            if (coastalLocked && b.level < 1) {
              return (
                <BuildingCard
                  key={b.id}
                  building={b}
                  coastalLocked
                  progressionLock={starterHidden ? (progression.locks.advanced ?? 'Komuta Merkezi yükseltin') : null}
                />
              );
            }
            if (coastalLocked) return null;
            return (
              <BuildingCard
                key={b.id}
                building={b}
                progressionLock={starterHidden ? (progression.locks.advanced ?? 'Komuta Merkezi yükseltin') : null}
              />
            );
          })}
        </div>
        <PopulationDistributionPanel />
      </div>
    </div>
  );
}
