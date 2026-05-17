import { useCountdown } from '../hooks/useCountdown';
import {
  CITY_NAME,
  CITY_TYPE,
  constructionQueue,
  expeditionSummary,
} from '../data/placeholder';

export default function CityStatusPanel() {
  const activeBuild = constructionQueue.find((q) => !q.queued);
  const buildTimer = useCountdown(activeBuild?.remaining ?? '—');
  const queuedBuilds = constructionQueue.filter((q) => q.queued).length;

  return (
    <section className="city-status-panel" aria-label="Genel durum">
      <div className="city-status-header">
        <div>
          <h2 className="city-status-title">{CITY_NAME}</h2>
          <p className="city-status-sub">{CITY_TYPE}</p>
        </div>
        <span className="city-status-badge">Genel Durum</span>
      </div>
      <div className="city-status-grid">
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">
            🏗️
          </span>
          <div>
            <span className="city-status-label">İnşaat Kuyruğu</span>
            <strong className="city-status-value">
              {activeBuild ? `${activeBuild.name} → Sv.${activeBuild.level}` : 'Boş'}
            </strong>
            {activeBuild && <span className="city-status-meta timer">{buildTimer}</span>}
            {queuedBuilds > 0 && (
              <span className="city-status-meta">+{queuedBuilds} sırada</span>
            )}
          </div>
        </div>
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">
            ↗️
          </span>
          <div>
            <span className="city-status-label">Giden Seferler</span>
            <strong className="city-status-value">{expeditionSummary.outgoing}</strong>
          </div>
        </div>
        <div className="city-status-card">
          <span className="city-status-icon" aria-hidden="true">
            ↙️
          </span>
          <div>
            <span className="city-status-label">Gelen Seferler</span>
            <strong className="city-status-value">{expeditionSummary.incoming}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

