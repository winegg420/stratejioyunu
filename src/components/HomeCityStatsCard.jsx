import { Link } from 'react-router-dom';
import { formatHappinessLabel } from '../lib/happinessSystem';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { PROTECTION_DAYS } from '../data/placeholder';
import { useGameStore } from '../stores/gameStore';

function StatRow({ icon, label, value, meta, warn }) {
  return (
    <div className={`home-city-stats__row${warn ? ' home-city-stats__row--warn' : ''}`}>
      <span className="home-city-stats__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="home-city-stats__body">
        <span className="home-city-stats__label">{label}</span>
        <strong className="home-city-stats__value">{value}</strong>
        {meta && <span className="home-city-stats__meta">{meta}</span>}
      </div>
    </div>
  );
}

export default function HomeCityStatsCard() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const activeCity = playerCities.find((c) => c.id === activeCityId);

  const resources = city?.resources ?? [];
  const withDepot = resources.filter((r) => r.max != null);
  const fullest = withDepot.reduce(
    (best, r) => {
      const pct = (r.current / r.max) * 100;
      return pct > (best?.pct ?? 0) ? { id: r.id, label: r.label, pct } : best;
    },
    null,
  );
  const builtCount = (city?.buildings ?? []).filter((b) => (b.level ?? 0) >= 1).length;
  const totalBuildings = city?.buildings?.length ?? 0;
  const happiness = city?.happiness ?? 0;
  const counterIntel = getCounterIntelProtectionPct(city);

  return (
    <section className="panel home-city-stats" aria-label="Şehir istatistikleri">
      <div className="home-city-stats__head">
        <h3 className="panel-title">
          <span className="panel-title__icon" aria-hidden="true">
            📊
          </span>
          Üs İstatistikleri
        </h3>
        <span className="home-city-stats__badge">[ TAKTİKSEL ÖZET ]</span>
      </div>
      <p className="home-city-stats__intro">
        <strong>{activeCity?.name ?? '—'}</strong>
        {' · '}
        {activeCity?.type ?? 'Şehir'}
        {activeCity?.provinceName ? ` · ${activeCity.provinceName}` : ''}
      </p>
      <div className="home-city-stats__grid">
        <StatRow
          icon="👥"
          label="Nüfus"
          value={(city?.population ?? 0).toLocaleString('tr-TR')}
          meta={`İşgücü: ${(city?.idlePopulation ?? 0).toLocaleString('tr-TR')}`}
        />
        <StatRow
          icon="📊"
          label="Moral"
          value={`%${happiness}`}
          meta={formatHappinessLabel(happiness)}
          warn={happiness < 45}
        />
        <StatRow
          icon="🏗️"
          label="İnşa Edilen"
          value={`${builtCount} / ${totalBuildings}`}
          meta="aktif bina"
        />
        <StatRow
          icon="🛡️"
          label="Karşı İstihbarat"
          value={`%${counterIntel}`}
          meta="casus savunması"
        />
        <StatRow
          icon="🏦"
          label="Vergi"
          value={`%${city?.taxRate ?? 15}`}
          meta="maliye oranı"
        />
        <StatRow
          icon="📦"
          label="Depo Doluluk"
          value={fullest ? `%${Math.round(fullest.pct)}` : '—'}
          meta={fullest ? `${fullest.label} rezervi` : 'depo verisi yok'}
          warn={fullest && fullest.pct >= 90}
        />
      </div>
      <p className="home-city-stats__footer">
        <span className="home-city-stats__shield" title={`${PROTECTION_DAYS} gün saldırı koruması`}>
          🛡 {PROTECTION_DAYS}G koruma
        </span>
        <Link to="/binalar" className="home-city-stats__link">
          Binalar →
        </Link>
      </p>
    </section>
  );
}
