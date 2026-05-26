import { useLanguage } from '../context/LanguageContext';
import { CITY_STATUS_COLORS, WORLD_ROLE_COLORS, hashOwnerColor } from './mapUtils';
import { WORLD_ROLES } from '../data/worldCitiesCatalog';
import { getCurrentPlayerName } from '../lib/playerIdentity';

export default function MapStatusLegend({ className = '' }) {
  const { t } = useLanguage();
  const playerName = getCurrentPlayerName();
  const foreignSample = hashOwnerColor('Rakip_Başkan');

  return (
    <div
      className={['map-status-legend', className].filter(Boolean).join(' ')}
      role="note"
      aria-label={t('map.legend.aria')}
    >
      <p className="map-status-legend__title">{t('map.legend.title')}</p>
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
      {playerName && playerName !== 'Oyuncu' && (
        <p className="map-status-legend__you">
          {t('map.legend.you', { name: playerName })}
        </p>
      )}
    </div>
  );
}
