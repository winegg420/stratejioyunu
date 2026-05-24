import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { formatHappinessLabel } from '../lib/happinessSystem';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { formatHourlyProduction, getHourlyAmount } from '../lib/hourlyProduction';
import { formatCompactNumber } from '../lib/formatNumber';
import { RESOURCE_CATALOG } from '../data/resourceCatalog';
import { PROTECTION_DAYS } from '../data/placeholder';
import { useGameStore, formatCitySubtitle } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';

const PRIMARY_PRODUCTION_IDS = ['hammadde', 'fuel', 'money'];

function resolveProductionRate(resource, cityReady, t) {
  if (!cityReady || !resource) {
    return { text: t('common.calculating'), pending: true };
  }
  if (resource.productionFrozen) {
    return { text: t('common.frozen'), pending: false };
  }
  const hourly = formatHourlyProduction(resource);
  if (hourly) {
    return { text: hourly, pending: false };
  }
  const rateStr = String(resource.rate ?? '').trim();
  const looksIdle = !rateStr || /^\+0(\b|\/|\.)/i.test(rateStr);
  if (looksIdle) {
    return { text: t('common.perHourZero'), pending: false };
  }
  if (getHourlyAmount(resource) <= 0) {
    return { text: t('common.calculating'), pending: true };
  }
  return { text: t('common.perHourZero'), pending: false };
}

function StatusMeter({ label, value, pct, warn, meta }) {
  const fill = Math.min(100, Math.max(0, pct ?? 0));
  const band = warn ? 'warn' : fill >= 65 ? 'ok' : fill >= 35 ? 'mid' : 'low';

  return (
    <div className={`strat-meter strat-meter--${band}${warn ? ' strat-meter--warn' : ''}`}>
      <div className="strat-meter__head">
        <span className="strat-meter__label">{label}</span>
        <strong className="strat-meter__value">{value}</strong>
      </div>
      <div className="strat-meter__gauge">
        <div
          className="strat-meter__track"
          role="progressbar"
          aria-valuenow={Math.round(fill)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div className="strat-meter__fill" style={{ width: `${fill}%` }} />
          <div className="strat-meter__ticks" aria-hidden="true" />
        </div>
        <span className="strat-meter__pct font-hud-data">{Math.round(fill)}%</span>
      </div>
      {meta && <span className="strat-meter__meta">{meta}</span>}
    </div>
  );
}

function ProductionRow({ resource, cityReady, t, resourceLabel }) {
  const rate = resolveProductionRate(resource, cityReady, t);
  const frozen = resource?.productionFrozen;
  const hasDepot = resource?.max != null;
  const depotPct = hasDepot ? (resource.current / resource.max) * 100 : null;
  const displayLabel = resource?.id
    ? resourceLabel(resource.id)
    : (resource?.label ?? '—');

  return (
    <div className={`strat-prod-row${frozen ? ' strat-prod-row--frozen' : ''}${rate.pending ? ' strat-prod-row--pending' : ''}`}>
      <span className="strat-prod-row__icon" aria-hidden="true">
        {resource?.icon ?? '•'}
      </span>
      <div className="strat-prod-row__body">
        <div className="strat-prod-row__head">
          <span className="strat-prod-row__label">{displayLabel}</span>
          <span
            className={[
              'strat-prod-row__rate',
              'font-hud-data',
              rate.pending && 'strat-prod-row__rate--pending',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {rate.text}
          </span>
        </div>
        {hasDepot && (
          <div className="strat-prod-row__gauge">
            <div className="strat-prod-row__track">
              <div
                className="strat-prod-row__fill"
                style={{ width: `${Math.min(100, depotPct)}%` }}
              />
            </div>
            <span className="strat-prod-row__depot-pct font-hud-data">{Math.round(depotPct)}%</span>
          </div>
        )}
        <span className="strat-prod-row__stock font-hud-data">
          {cityReady && resource
            ? (
              <>
                {formatCompactNumber(resource.current)}
                {hasDepot && ` / ${formatCompactNumber(resource.max)}`}
              </>
            )
            : '[ ... ]'}
        </span>
      </div>
    </div>
  );
}

export default function StrategicManagementMatrix() {
  const { t, lang, resourceLabel } = useLanguage();
  const [taxSliderOpen, setTaxSliderOpen] = useState(false);
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const expeditions = useGameStore((s) => s.expeditions);
  const setCityTaxRate = useGameStore((s) => s.setCityTaxRate);

  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const resources = city?.resources ?? [];
  const happiness = city?.happiness ?? 0;
  const counterIntel = getCounterIntelProtectionPct(city);
  const builtCount = (city?.buildings ?? []).filter((b) => (b.level ?? 0) >= 1).length;
  const totalBuildings = city?.buildings?.length ?? 1;
  const buildPct = (builtCount / totalBuildings) * 100;
  const foodRes = resources.find((r) => r.id === 'food');
  const popPct = foodRes?.max ? ((foodRes.current / foodRes.max) * 100) : 0;
  const withDepot = resources.filter((r) => r.max != null);
  const fullest = withDepot.reduce(
    (best, r) => {
      const pct = (r.current / r.max) * 100;
      return pct > (best?.pct ?? 0) ? { label: resourceLabel(r.id), pct } : best;
    },
    null,
  );
  const activeBuild = city?.constructionQueue?.find((q) => !q.queued);
  const queuedBuilds = city?.constructionQueue?.filter((q) => q.queued).length ?? 0;
  const buildRemaining = activeBuild ? remainingFromEndsAt(activeBuild.endsAt, now) : 0;
  const outgoing = expeditions.filter((e) => e.direction === 'outgoing').length;
  const incoming = expeditions.filter((e) => e.direction === 'returning').length;
  const cyberFx = (city?.cyberEffects ?? []).filter((fx) => !fx.endsAt || fx.endsAt > now).length;
  const cityReady = Boolean(city && resources.length > 0);
  const productionRows = PRIMARY_PRODUCTION_IDS.map((id) => {
    const found = resources.find((r) => r.id === id);
    const meta = RESOURCE_CATALOG[id];
    return found ?? {
      id,
      label: meta?.label ?? id,
      icon: meta?.icon ?? '•',
      current: 0,
      max: meta?.starter?.max ?? null,
      rate: null,
    };
  });
  const locale = lang === 'en' ? 'en-US' : 'tr-TR';

  return (
    <section className="strat-matrix panel glass-panel" aria-label={t('pages.home.stratMatrix.aria')}>
      <header className="strat-matrix__header">
        <div>
          <h3 className="strat-matrix__title">
            <span className="panel-title__icon" aria-hidden="true">
              ◈
            </span>
            {t('pages.home.stratMatrix.title')}
          </h3>
          <p className="strat-matrix__city">{formatCitySubtitle(activeCity, lang)}</p>
        </div>
        <span className="strat-matrix__badge">{t('pages.home.stratMatrix.badge')}</span>
      </header>

      <div className="strat-matrix__grid">
        <div className="strat-matrix__col strat-matrix__col--status">
          <h4 className="strat-matrix__col-title">{t('pages.home.stratMatrix.statusCol')}</h4>
          <StatusMeter
            label={t('pages.home.stratMatrix.popReserve')}
            value={(city?.population ?? 0).toLocaleString(locale)}
            pct={popPct}
            meta={t('pages.home.stratMatrix.workforce', {
              count: (city?.idlePopulation ?? 0).toLocaleString(locale),
            })}
          />
          <StatusMeter
            label={t('pages.home.stratMatrix.morale')}
            value={`%${happiness}`}
            pct={happiness}
            warn={happiness < 45}
            meta={formatHappinessLabel(happiness, lang)}
          />
          <StatusMeter
            label={t('pages.home.stratMatrix.buildCapacity')}
            value={`${builtCount} / ${totalBuildings}`}
            pct={buildPct}
            meta={t('pages.home.stratMatrix.activeBuildings')}
          />
          <StatusMeter
            label={t('pages.home.stratMatrix.counterIntel')}
            value={`%${counterIntel}`}
            pct={counterIntel}
            meta={t('pages.home.stratMatrix.spyDefense')}
          />
          <StatusMeter
            label={t('pages.home.stratMatrix.depotFill')}
            value={fullest ? `%${Math.round(fullest.pct)}` : '—'}
            pct={fullest?.pct ?? 0}
            warn={fullest && fullest.pct >= 90}
            meta={fullest
              ? t('pages.home.stratMatrix.depotReserve', { label: fullest.label })
              : '—'}
          />
          <div className="strat-matrix__ops">
            <div className="strat-ops-chip">
              <span className="strat-ops-chip__label">{t('pages.home.stratMatrix.construction')}</span>
              <strong>
                {activeBuild
                  ? `${activeBuild.name} ${t('common.levelShort')}${activeBuild.targetLevel}`
                  : t('pages.home.stratMatrix.empty')}
              </strong>
              {activeBuild && (
                <span className="strat-ops-chip__timer font-hud-data">
                  {formatSeconds(buildRemaining)}
                </span>
              )}
              {queuedBuilds > 0 && (
                <span className="strat-ops-chip__meta">
                  {t('pages.home.stratMatrix.queued', { count: queuedBuilds })}
                </span>
              )}
            </div>
            <div className="strat-ops-chip">
              <span className="strat-ops-chip__label">{t('pages.home.stratMatrix.operations')}</span>
              <strong>
                ↗ {outgoing} · ↙ {incoming}
              </strong>
              {cyberFx > 0 && (
                <span className="strat-ops-chip__meta strat-ops-chip__meta--alert">
                  {t('pages.home.stratMatrix.cyberPressure', { count: cyberFx })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="strat-matrix__col strat-matrix__col--production">
          <h4 className="strat-matrix__col-title">{t('pages.home.stratMatrix.productionCol')}</h4>
          <div className="strat-prod-list">
            {productionRows.map((r) => (
              <ProductionRow
                key={r.id}
                resource={r}
                cityReady={cityReady}
                t={t}
                resourceLabel={resourceLabel}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`strat-matrix__tax${taxSliderOpen ? ' strat-matrix__tax--open' : ''}`}>
        <button
          type="button"
          className="strat-tax__toggle"
          onClick={() => setTaxSliderOpen((v) => !v)}
          aria-expanded={taxSliderOpen}
          aria-controls="strat-tax-slider"
        >
          <span className="strat-tax__label">{t('pages.home.stratMatrix.taxRate')}</span>
          <strong className="strat-tax__value font-hud-data">%{city?.taxRate ?? 15}</strong>
        </button>
        {taxSliderOpen && (
          <div id="strat-tax-slider" className="strat-tax__slider-wrap">
            <input
              type="range"
              className="strat-tax__slider"
              min="0"
              max="30"
              step="1"
              value={city?.taxRate ?? 15}
              onChange={(e) => setCityTaxRate(Number(e.target.value))}
              aria-label={t('pages.home.stratMatrix.taxAria')}
            />
            <div className="strat-tax__scale" aria-hidden="true">
              <span>0%</span>
              <span>30%</span>
            </div>
          </div>
        )}
        <span className="strat-tax__hint">{t('pages.home.stratMatrix.taxHint')}</span>
      </div>

      <footer className="strat-matrix__footer">
        <span
          className="strat-matrix__shield"
          title={t('pages.home.stratMatrix.protectionTitle', { days: PROTECTION_DAYS })}
        >
          🛡 {t('pages.home.stratMatrix.protectionDays', { days: PROTECTION_DAYS })}
        </span>
        <Link to="/binalar" className="strat-matrix__link">
          {t('pages.home.stratMatrix.buildingsLink')}
        </Link>
      </footer>
    </section>
  );
}
