import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getPopulationBreakdown } from '../lib/cityManagementUi';
import { useLanguage } from '../context/LanguageContext';

const POP_LABEL_KEYS = {
  Workforce: 'cityManagement.popWorkforce',
  Military: 'cityManagement.popMilitary',
  Unemployed: 'cityManagement.popUnemployed',
};

export default function PopulationDistributionPanel({ className = '' }) {
  const { t, lang } = useLanguage();
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const breakdown = useMemo(() => getPopulationBreakdown(city), [city]);
  const locale = lang === 'en' ? 'en-US' : 'tr-TR';

  return (
    <section
      className={['population-dist-panel', 'panel', className].filter(Boolean).join(' ')}
      aria-label={t('cityManagement.populationAria')}
    >
      <h3 className="panel-title population-dist-panel__title">{t('cityManagement.populationTitle')}</h3>
      <p className="population-dist-panel__total font-hud-data">
        {t('cityManagement.populationTotal', {
          total: breakdown.total.toLocaleString(locale),
        })}
      </p>
      <div className="population-dist-panel__bar" role="img" aria-label={t('cityManagement.populationBarAria')}>
        {breakdown.segments.map((seg) => {
          const label = t(POP_LABEL_KEYS[seg.id]);
          return (
            <span
              key={seg.id}
              className="population-dist-panel__segment"
              style={{ width: `${seg.pct}%`, background: seg.color }}
              title={`${label}: ${seg.value.toLocaleString(locale)} (%${seg.pct})`}
            />
          );
        })}
      </div>
      <ul className="population-dist-panel__legend">
        {breakdown.segments.map((seg) => {
          const label = t(POP_LABEL_KEYS[seg.id]);
          return (
            <li key={seg.id}>
              <span className="population-dist-panel__dot" style={{ background: seg.color }} />
              <span className="population-dist-panel__label">{label}</span>
              <span className="population-dist-panel__value font-hud-data">
                {seg.value.toLocaleString(locale)}
                <span className="population-dist-panel__pct"> (%{seg.pct})</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
