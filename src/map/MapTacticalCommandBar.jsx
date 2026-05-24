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
        <div className="map-ideology-legend" role="list" aria-label="İdeoloji renk açıklaması">
          {Object.values(IDEOLOGY_PROFILES).map((p) => (
            <span key={p.id} className="map-ideology-legend__item" role="listitem">
              <span
                className="map-ideology-legend__dot"
                style={{ background: p.color, boxShadow: `0 0 6px ${p.colorGlow ?? p.color}` }}
                aria-hidden="true"
              />
              <span className="map-ideology-legend__name">{p.label}</span>
              <span className="map-ideology-legend__sub">{p.subtitle}</span>
            </span>
          ))}
          <span className="map-ideology-legend__ally">◈ Aynı ideoloji = Doğal Müttefik</span>
        </div>
      )}
    </div>
  );
}

export default memo(MapTacticalCommandBar);
