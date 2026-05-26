import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import BuildingCard from '../components/BuildingCard';
import EmpireSlotBanner from '../components/EmpireSlotBanner';
import PopulationDistributionPanel from '../components/PopulationDistributionPanel';
import { getHqLevel, syncCityBuildingsToCatalog } from '../lib/buildingUtils';
import { getProgressionState } from '../lib/progressionSystem';
import { isTutorialBuildingVisible, isMilAiTutorialActive } from '../lib/milAiTutorialQuests';
import { isCoastalPlayerCity, getConstructionQueueSummary } from '../lib/cityManagementUi';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import PageSessionGate from '../components/PageSessionGate';
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
  const cities = useGameStore((s) => s.cities);
  const milAiCompleted = useGameStore((s) => s.milAiCompleted);
  const city = cities[activeCityId];
  const tutorialState = { activeCityId, cities, milAiCompleted };
  const tutorialActive = isMilAiTutorialActive(tutorialState);
  const activePlayerCity = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId));
  const buildings = useMemo(
    () => syncCityBuildingsToCatalog(city?.buildings ?? STORE_EMPTY_ARRAY),
    [city?.buildings],
  );
  const hqLevel = getHqLevel(city);
  const progression = getProgressionState(city);
  const coastal = isCoastalPlayerCity(activePlayerCity);
  const playerMeta = useGameStore((s) => s.playerMeta);
  const queueSummary = getConstructionQueueSummary(city, playerMeta);

  useEffect(() => {
    if (!hash) return undefined;
    const timer = window.setTimeout(() => scrollToBuildingFromHash(hash), 80);
    return () => window.clearTimeout(timer);
  }, [hash, buildings]);

  if (!city) {
    return (
      <PageSessionGate loadingMessageKey="pages.buildings.loading">
        <div className="page page-wrapper buildings-page page--console">
          <LocalizedPageHeader pageKey="buildings" />
          <p className="buildings-page-loading" role="status">{t('pages.buildings.loading')}</p>
        </div>
      </PageSessionGate>
    );
  }

  return (
    <PageSessionGate loadingMessageKey="pages.buildings.loading">
      <div className="page page-wrapper buildings-page page--console">
      <LocalizedPageHeader pageKey="buildings" />
      <EmpireSlotBanner />
      <div className="buildings-page__toolbar">
        <span className="buildings-queue-badge font-hud-data" title={t('cityManagement.queueToolbarTitle')}>
          {t('cityManagement.queueActive', { active: queueSummary.activeCount })}
          {' · '}
          {t('cityManagement.queueTotal', { total: queueSummary.total, limit: queueSummary.limit })}
        </span>
      </div>
      <div className="buildings-page__grid-wrap">
        <PopulationDistributionPanel />
        <div className="buildings-grid card-grid">
          {buildings.map((b) => {
            const starterHidden = tutorialActive
              ? !isTutorialBuildingVisible(b.id, tutorialState)
              : false;
            const coastalLocked = b.id === 'shipyard' && !coastal;
            if (coastalLocked && b.level < 1) {
              return (
                <BuildingCard
                  key={b.id}
                  building={b}
                  coastalLocked
                  progressionLock={
                    starterHidden
                      ? (progression.locks.advanced ?? t('pages.buildings.lockUpgradeHq'))
                      : null
                  }
                />
              );
            }
            if (coastalLocked) return null;
            return (
              <BuildingCard
                key={b.id}
                building={b}
                progressionLock={
                  starterHidden
                    ? (progression.locks.advanced ?? t('pages.buildings.lockUpgradeHq'))
                    : null
                }
              />
            );
          })}
        </div>
      </div>
      </div>
    </PageSessionGate>
  );
}
