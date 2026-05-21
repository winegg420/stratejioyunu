import { Link } from 'react-router-dom';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { formatHappinessLabel } from '../lib/happinessSystem';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { formatHourlyProduction, getHourlyAmount } from '../lib/hourlyProduction';
import { formatCompactNumber } from '../lib/formatNumber';
import { RESOURCE_CATALOG } from '../data/resourceCatalog';
import { PROTECTION_DAYS } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';

const PRIMARY_PRODUCTION_IDS = ['metal', 'fuel', 'money'];

function resolveProductionRate(resource, cityReady) {
  if (!cityReady || !resource) {
    return { text: '[ HESAPLANIYOR... ]', pending: true };
  }
  if (resource.productionFrozen) {
    return { text: '[ STGN ]', pending: false };
  }
  const hourly = formatHourlyProduction(resource);
  if (hourly) {
    return { text: hourly, pending: false };
  }
  const rateStr = String(resource.rate ?? '').trim();
  const looksIdle = !rateStr || /^\+0(\b|\/|\.)/i.test(rateStr);
  if (looksIdle) {
    return { text: '+0/saat', pending: false };
  }
  if (getHourlyAmount(resource) <= 0) {
    return { text: '[ HESAPLANIYOR... ]', pending: true };
  }
  return { text: '+0/saat', pending: false };
}

function StatusMeter({ label, value, pct, warn, meta }) {
  const fill = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div className={`strat-meter${warn ? ' strat-meter--warn' : ''}`}>
      <div className="strat-meter__head">
        <span className="strat-meter__label">{label}</span>
        <strong className="strat-meter__value">{value}</strong>
      </div>
      <div
        className="strat-meter__track"
        role="progressbar"
        aria-valuenow={fill}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="strat-meter__fill" style={{ width: `${fill}%` }} />
      </div>
      {meta && <span className="strat-meter__meta">{meta}</span>}
    </div>
  );
}

function ProductionRow({ resource, cityReady }) {
  const rate = resolveProductionRate(resource, cityReady);
  const frozen = resource?.productionFrozen;
  const hasDepot = resource?.max != null;
  const depotPct = hasDepot ? (resource.current / resource.max) * 100 : null;

  return (
    <div className={`strat-prod-row${frozen ? ' strat-prod-row--frozen' : ''}${rate.pending ? ' strat-prod-row--pending' : ''}`}>
      <span className="strat-prod-row__icon" aria-hidden="true">
        {resource?.icon ?? '•'}
      </span>
      <div className="strat-prod-row__body">
        <div className="strat-prod-row__head">
          <span className="strat-prod-row__label">{resource?.label ?? '—'}</span>
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
          <div className="strat-prod-row__track">
            <div
              className="strat-prod-row__fill"
              style={{ width: `${Math.min(100, depotPct)}%` }}
            />
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
      return pct > (best?.pct ?? 0) ? { label: r.label, pct } : best;
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

  return (
    <section className="strat-matrix panel" aria-label="Stratejik yönetim matrisi">
      <header className="strat-matrix__header">
        <div>
          <h3 className="strat-matrix__title">
            <span className="panel-title__icon" aria-hidden="true">
              ◈
            </span>
            Stratejik Yönetim Matrisi
          </h3>
          <p className="strat-matrix__city">
            <strong>{activeCity?.name ?? '—'}</strong>
            {' · '}
            {activeCity?.type ?? 'Üs'}
            {activeCity?.provinceName ? ` · ${activeCity.provinceName}` : ''}
          </p>
        </div>
        <span className="strat-matrix__badge">[ TAKTİKSEL ÖZET ]</span>
      </header>

      <div className="strat-matrix__grid">
        <div className="strat-matrix__col strat-matrix__col--status">
          <h4 className="strat-matrix__col-title">Durum Grafikleri</h4>
          <StatusMeter
            label="Nüfus Rezervi"
            value={(city?.population ?? 0).toLocaleString('tr-TR')}
            pct={popPct}
            meta={`İşgücü: ${(city?.idlePopulation ?? 0).toLocaleString('tr-TR')}`}
          />
          <StatusMeter
            label="Moral"
            value={`%${happiness}`}
            pct={happiness}
            warn={happiness < 45}
            meta={formatHappinessLabel(happiness)}
          />
          <StatusMeter
            label="İnşa Kapasitesi"
            value={`${builtCount} / ${totalBuildings}`}
            pct={buildPct}
            meta="aktif bina"
          />
          <StatusMeter
            label="Karşı İstihbarat"
            value={`%${counterIntel}`}
            pct={counterIntel}
            meta="casus savunması"
          />
          <StatusMeter
            label="Depo Doluluk"
            value={fullest ? `%${Math.round(fullest.pct)}` : '—'}
            pct={fullest?.pct ?? 0}
            warn={fullest && fullest.pct >= 90}
            meta={fullest ? `${fullest.label} rezervi` : '—'}
          />
          <div className="strat-matrix__ops">
            <div className="strat-ops-chip">
              <span className="strat-ops-chip__label">İnşaat</span>
              <strong>
                {activeBuild
                  ? `${activeBuild.name} Sv.${activeBuild.targetLevel}`
                  : 'Boş'}
              </strong>
              {activeBuild && (
                <span className="strat-ops-chip__timer font-hud-data">
                  {formatSeconds(buildRemaining)}
                </span>
              )}
              {queuedBuilds > 0 && (
                <span className="strat-ops-chip__meta">+{queuedBuilds} sırada</span>
              )}
            </div>
            <div className="strat-ops-chip">
              <span className="strat-ops-chip__label">Seferler</span>
              <strong>
                ↗ {outgoing} · ↙ {incoming}
              </strong>
              {cyberFx > 0 && (
                <span className="strat-ops-chip__meta strat-ops-chip__meta--alert">
                  Siber baskı: {cyberFx}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="strat-matrix__col strat-matrix__col--production">
          <h4 className="strat-matrix__col-title">Saatlik Üretim</h4>
          <div className="strat-prod-list">
            {productionRows.map((r) => (
              <ProductionRow key={r.id} resource={r} cityReady={cityReady} />
            ))}
          </div>
        </div>
      </div>

      <div className="strat-matrix__tax">
        <div className="strat-tax__head">
          <span className="strat-tax__label">Vergi Oranı</span>
          <strong className="strat-tax__value font-hud-data">%{city?.taxRate ?? 15}</strong>
        </div>
        <input
          type="range"
          className="strat-tax__slider"
          min="5"
          max="40"
          step="1"
          value={city?.taxRate ?? 15}
          onChange={(e) => setCityTaxRate(Number(e.target.value))}
          aria-label="Vergi oranı"
        />
        <span className="strat-tax__hint">Yüksek vergi morali düşürür · maliye hattı</span>
      </div>

      <footer className="strat-matrix__footer">
        <span className="strat-matrix__shield" title={`${PROTECTION_DAYS} gün saldırı koruması`}>
          🛡 {PROTECTION_DAYS}G koruma
        </span>
        <Link to="/binalar" className="strat-matrix__link">
          Binalar →
        </Link>
      </footer>
    </section>
  );
}
