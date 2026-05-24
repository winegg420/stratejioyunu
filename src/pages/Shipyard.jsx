import { useEffect } from 'react';
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

  useEffect(() => {
    if (isCoastal) return undefined;
    const el = document.getElementById('resource-bar-city-switch');
    el?.classList.add('shipyard-city-highlight');
    return () => el?.classList.remove('shipyard-city-highlight');
  }, [isCoastal]);

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
          footer={(
            <div className="shipyard-inland-guide">
              <p className="shipyard-inland-guide__text">{t('pages.shipyard.switchCityHint')}</p>
              <div className="shipyard-inland-guide__arrow" aria-hidden="true">
                <span className="shipyard-inland-guide__arrow-line" />
                <span className="shipyard-inland-guide__arrow-head">▲</span>
              </div>
              <p className="shipyard-inland-guide__target">
                <span className="shipyard-inland-guide__target-label">{t('pages.shipyard.switchCityLabel')}</span>
              </p>
            </div>
          )}
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
                <UnitCard
                  unit={{ ...u, name: unitName(u.id, u.name) }}
                  iconDomain="sea"
                />
              </LockedFeatureGate>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
