import { useGameStore } from '../stores/gameStore';
import { formatCompactNumber } from '../lib/formatNumber';
import { formatHourlyProduction } from '../lib/hourlyProduction';
import { getProgressionState } from '../lib/progressionSystem';
import { useLanguage } from '../context/LanguageContext';

/**
 * Uranyum — yalnızca Binalar / Araştırma sayfalarında (üst bar dışı).
 */
export default function UraniumContextPanel({ className = '' }) {
  const { t, resourceLabel } = useLanguage();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const uranium = city?.resources?.find((r) => r.id === 'uranium');
  const progression = getProgressionState(city);

  if (!progression?.kbrnUnlocked && !uranium) return null;

  const label = resourceLabel('uranium') || 'Uranyum';
  const hourly = uranium ? formatHourlyProduction(uranium) : null;

  return (
    <aside
      className={['uranium-context-panel', 'glass-panel', className].filter(Boolean).join(' ')}
      aria-label={label}
    >
      <span className="uranium-context-panel__icon" aria-hidden="true">☢️</span>
      <div className="uranium-context-panel__body">
        <span className="uranium-context-panel__label">{label}</span>
        <strong className="uranium-context-panel__value font-hud-data">
          {uranium ? formatCompactNumber(uranium.current) : '—'}
          {uranium?.max != null && (
            <span className="uranium-context-panel__max">
              {' '}/ {formatCompactNumber(uranium.max)}
            </span>
          )}
        </strong>
        {hourly && (
          <span className="uranium-context-panel__rate font-hud-data">{hourly}</span>
        )}
        {!progression?.kbrnUnlocked && (
          <span className="uranium-context-panel__hint">{t('uraniumContext.lockedHint')}</span>
        )}
      </div>
    </aside>
  );
}
