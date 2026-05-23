import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { formatHappinessLabel } from '../lib/happinessSystem';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { useGameStore } from '../stores/gameStore';

export default function CityStatusPanel() {
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const expeditions = useGameStore((s) => s.expeditions);
  const setCityTaxRate = useGameStore((s) => s.setCityTaxRate);

  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const activeBuild = city?.constructionQueue?.find((q) => !q.queued);
  const queuedBuilds = city?.constructionQueue?.filter((q) => q.queued).length ?? 0;
  const outgoing = expeditions.filter((e) => e.direction === 'outgoing').length;
  const incoming = expeditions.filter((e) => e.direction === 'returning').length;
  const buildRemaining = activeBuild ? remainingFromEndsAt(activeBuild.endsAt, now) : 0;
  const counterIntelPct = getCounterIntelProtectionPct(city);
  const happiness = city?.happiness ?? 0;
  const happinessLabel = formatHappinessLabel(happiness);
  const cyberFx = (city?.cyberEffects ?? []).filter((fx) => !fx.endsAt || fx.endsAt > now).length;

  return (
    <section className="city-status-panel" aria-label="Genel durum">
      <div className="city-status-header">
        <div>
          <h2 className="city-status-title">{activeCity?.name}</h2>
          <p className="city-status-sub">{activeCity?.type}</p>
        </div>
        <span className="city-status-badge">Genel Durum</span>
      </div>
      <div className="city-status-grid">
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">👥</span>
          <div>
            <span className="city-status-label">Nüfus</span>
            <strong className="city-status-value">
              {(city?.population ?? 0).toLocaleString('tr-TR')}
            </strong>
            <span className="city-status-meta">
              İşgücü: {(city?.idlePopulation ?? 0).toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
        <div className={`city-status-card city-status-card--morale${happiness < 45 ? ' city-status-card--warn' : ''}`}>
          <span className="city-status-icon" aria-hidden="true">📊</span>
          <div>
            <span className="city-status-label">Mutluluk</span>
            <strong className="city-status-value">%{happiness} · {happinessLabel}</strong>
            {cyberFx > 0 && (
              <span className="city-status-meta">Aktif siber baskı: {cyberFx}</span>
            )}
          </div>
        </div>
        <div className="city-status-card city-status-card--tax">
          <span className="city-status-icon" aria-hidden="true">🏦</span>
          <div>
            <span className="city-status-label">Vergi Oranı</span>
            <div className="city-status-tax-row">
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={city?.taxRate ?? 15}
                onChange={(e) => setCityTaxRate(Number(e.target.value))}
                aria-label="Vergi oranı"
              />
              <strong className="city-status-value">%{city?.taxRate ?? 15}</strong>
            </div>
            <span className="city-status-meta">Yüksek vergi morali düşürür</span>
          </div>
        </div>
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">🏗️</span>
          <div>
            <span className="city-status-label">İnşaat Kuyruğu</span>
            <strong className="city-status-value">
              {activeBuild ? `${activeBuild.name} → Sv.${activeBuild.targetLevel}` : 'Boş'}
            </strong>
            {activeBuild && (
              <span className="city-status-meta timer">{formatSeconds(buildRemaining)}</span>
            )}
            {queuedBuilds > 0 && (
              <span className="city-status-meta">+{queuedBuilds} sırada</span>
            )}
          </div>
        </div>
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">↗️</span>
          <div>
            <span className="city-status-label">Giden Operasyonlar</span>
            <strong className="city-status-value">{outgoing}</strong>
          </div>
        </div>
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">↙️</span>
          <div>
            <span className="city-status-label">Gelen Operasyonlar</span>
            <strong className="city-status-value">{incoming}</strong>
          </div>
        </div>
        <div className="city-status-card city-status-card--intel">
          <span className="city-status-icon" aria-hidden="true">🛡️</span>
          <div>
            <span className="city-status-label">Karşı İstihbarat</span>
            <strong className="city-status-value">%{counterIntelPct}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
