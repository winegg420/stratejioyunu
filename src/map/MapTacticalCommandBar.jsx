import { memo } from 'react';
import { IDEOLOGY_PROFILES } from '../lib/ideologySystem';

function MapTacticalCommandBar({
  ideologyView,
  onToggleIdeology,
  isFullscreen,
}) {
  return (
    <div className="map-tactical-command-bar" role="toolbar" aria-label="Taktik komuta şeridi">
      <button
        type="button"
        className={`btn btn-secondary btn-sm map-ideology-toggle${ideologyView ? ' active' : ''}`}
        onClick={onToggleIdeology}
        aria-pressed={ideologyView}
        disabled={isFullscreen}
      >
        [ SİYASİ İDEOLOJİ GÖRÜNÜMÜ ]
      </button>
      {ideologyView && (
        <div className="map-ideology-legend" aria-hidden="true">
          {Object.values(IDEOLOGY_PROFILES).map((p) => (
            <span key={p.id} className="map-ideology-legend__item" style={{ color: p.color }}>
              {p.emoji} {p.subtitle}
            </span>
          ))}
          <span className="map-ideology-legend__ally">◈ Aynı ideoloji = Doğal Müttefik</span>
        </div>
      )}
    </div>
  );
}

export default memo(MapTacticalCommandBar);
