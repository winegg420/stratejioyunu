import { useMemo } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import DefenseSystemCard from '../components/DefenseSystemCard';
import DefenseQueuePanel from '../components/DefenseQueuePanel';
import { DEFENSE_SYSTEMS } from '../data/defenseCatalog';
import { normalizeCityDefense } from '../lib/defenseSystemUtils';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';
import '../styles/defense-command.css';

export default function Defense() {
  const { t } = useLanguage();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cityName = useGameStore((s) => s.playerCities.find((c) => c.id === activeCityId)?.name);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const defenseQueue = city?.defenseQueue ?? STORE_EMPTY_ARRAY;

  const { defenseInventory } = useMemo(
    () => normalizeCityDefense(city),
    [city],
  );

  const queueBusy = defenseQueue.some((q) => !q.queued);

  return (
    <div className="page page--console defense-page defense-page--military">
      <LocalizedPageHeader pageKey="defense" />
      <p className="defense-page__intro">{t('pages.defense.intro')}</p>
      <section className="defense-systems-section" aria-labelledby="defense-systems-heading">
        <h2 id="defense-systems-heading" className="defense-section-title">
          {t('pages.defense.systemsSection')}
        </h2>
        <div className="card-grid defense-systems-grid">
          {DEFENSE_SYSTEMS.map((def) => (
            <DefenseSystemCard
              key={def.id}
              def={def}
              inventory={defenseInventory[def.id]}
              queueBusy={queueBusy && !defenseQueue.some((q) => q.systemId === def.id && !q.queued)}
            />
          ))}
        </div>
      </section>
      <DefenseQueuePanel cityName={cityName} queue={defenseQueue} />
    </div>
  );
}
