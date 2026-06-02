import { useLanguage } from '../context/LanguageContext';
import { CITY_STATUS_COLORS, WORLD_ROLE_COLORS, hashOwnerColor } from './mapUtils';
import { WORLD_ROLES } from '../data/worldCitiesCatalog';
import { usePlayerDisplayName } from '../lib/playerIdentityHooks';
import { IDEOLOGY_PROFILES } from '../lib/ideologySystem';

export default function MapStatusLegend({ className = '', ideologyView = false }) {
  const { t } = useLanguage();
  const playerName = usePlayerDisplayName();
  const foreignSample = hashOwnerColor('Rakip_Başkan');
  const isFullscreenLegend = className.includes('map-status-legend--fs');

  return (
    <div
      className={['map-status-legend', className].filter(Boolean).join(' ')}
      role="note"
      aria-label={ideologyView ? t('map.ideology.legendAria') : t('map.legend.aria')}
    >
      <p className="map-status-legend__title">{t('map.legend.title')}</p>

      {ideologyView && isFullscreenLegend && (
        <p className="map-status-legend__ideology-blocs" role="note">
          {t('map.legend.ideologyBlocsFs')}
        </p>
      )}

      {!ideologyView && (
        <ul className="map-status-legend__list">
          <li>
            <span className="map-status-legend__swatch map-status-legend__swatch--own" />
            {t('map.legend.own')}
          </li>
          <li>
            <span
              className="map-status-legend__swatch"
              style={{ background: foreignSample }}
            />
            {t('map.legend.foreignPlayer')}
          </li>
          <li>
            <span
              className="map-status-legend__swatch"
              style={{ background: WORLD_ROLE_COLORS[WORLD_ROLES.BOT_COASTAL] }}
            />
            {t('map.legend.botCoastal')}
          </li>
          <li>
            <span
              className="map-status-legend__swatch"
              style={{ background: WORLD_ROLE_COLORS[WORLD_ROLES.BOT_CAPITAL] }}
            />
            {t('map.legend.botCapital')}
          </li>
          <li>
            <span
              className="map-status-legend__swatch"
              style={{ background: WORLD_ROLE_COLORS[WORLD_ROLES.MEGA_CITY] }}
            />
            {t('map.legend.mega')}
          </li>
          <li>
            <span
              className="map-status-legend__swatch"
              style={{ background: CITY_STATUS_COLORS.empty }}
            />
            {t('map.legend.empty')}
          </li>
        </ul>
      )}

      {ideologyView && isFullscreenLegend && (
        <ul className="map-status-legend__list map-status-legend__list--ideology">
          {Object.values(IDEOLOGY_PROFILES).map((p) => (
            <li key={p.id}>
              <span
                className="map-status-legend__swatch"
                style={{ background: p.color }}
              />
              {p.label} {p.emoji}
            </li>
          ))}
          <li>
            <span
              className="map-status-legend__swatch map-status-legend__swatch--own-ideo"
              style={{ background: IDEOLOGY_PROFILES.socialist?.color }}
            />
            {t('map.legend.ownIdeologyOutline')}
          </li>
        </ul>
      )}

      <p className="map-status-legend__you">
        {t('map.legend.you', { name: playerName })}
      </p>
    </div>
  );
}
