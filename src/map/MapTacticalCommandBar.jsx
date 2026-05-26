import { memo } from 'react';
import { IDEOLOGY_PROFILES } from '../lib/ideologySystem';
import { useLanguage } from '../context/LanguageContext';
import { resolveIdeologyToggleLabel } from './mapUiLabels';

function MapTacticalCommandBar({
  ideologyView,
  onToggleIdeology,
}) {
  const { t } = useLanguage();
  const ideologyToggleLabel = resolveIdeologyToggleLabel(t);

  return (
    <div className="map-tactical-command-bar" role="toolbar" aria-label={t('map.ideology.toolbarAria')}>
      <button
        type="button"
        className={`btn btn-secondary btn-sm map-ideology-toggle${ideologyView ? ' active' : ''}`}
        onClick={onToggleIdeology}
        aria-pressed={ideologyView}
        title={t('map.ideology.toggleHint')}
      >
        {ideologyToggleLabel}
      </button>
      {ideologyView && (
        <div className="map-ideology-legend" role="list" aria-label={t('map.ideology.legendAria')}>
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
          <span className="map-ideology-legend__ally">{t('map.ideology.allyLegend')}</span>
          <p className="map-ideology-legend__explain">{t('map.ideology.worldExplain')}</p>
        </div>
      )}
    </div>
  );
}

export default memo(MapTacticalCommandBar);
