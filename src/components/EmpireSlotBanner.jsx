import { useGameStore } from '../stores/gameStore';
import { getEmpireSlotSummary } from '../lib/cityManagementUi';
import { formatEmpireSlotHint } from '../lib/empireExpansion';
import { useLanguage } from '../context/LanguageContext';

export default function EmpireSlotBanner({ className = '' }) {
  const { t } = useLanguage();
  const playerCities = useGameStore((s) => s.playerCities);
  const cities = useGameStore((s) => s.cities);
  const activeCityId = useGameStore((s) => s.activeCityId);

  const state = { playerCities, cities };
  const slot = getEmpireSlotSummary(state);
  const hint = formatEmpireSlotHint(state);
  const activeCity = playerCities.find((c) => c.id === activeCityId);

  return (
    <header
      className={['empire-slot-banner', className].filter(Boolean).join(' ')}
      aria-label={t('cityManagement.empireAria')}
    >
      <div className="empire-slot-banner__main">
        <span className="empire-slot-banner__tag font-hud-data">{t('cityManagement.sectionTag')}</span>
        <strong className="empire-slot-banner__slots">
          {t('cityManagement.slotLabel', { owned: slot.owned, max: slot.maxSlots })}
        </strong>
        <span className="empire-slot-banner__hq">
          {t('cityManagement.hqLevel', { level: slot.hqLevel })}
        </span>
      </div>
      <div className="empire-slot-banner__meta">
        <span>{t('cityManagement.activeCityBase', { name: activeCity?.name ?? '—' })}</span>
        <span>{t('cityManagement.coloniesMeta', { count: slot.colonies, hint })}</span>
      </div>
    </header>
  );
}
