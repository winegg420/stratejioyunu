import { useLanguage } from '../context/LanguageContext';
import MapIntelSidebar from './MapIntelSidebar';
import MapMiniMap from './MapMiniMap';

/**
 * Tam ekran komuta merkezi — sağ sütun (istihbarat + mini harita).
 * Boş okyanus bandını “ölü alan” yerine C4ISR paneli yapar.
 */
export default function MapCommandRail({ viewport, activeCity, mapCities }) {
  const { t } = useLanguage();

  return (
    <aside className="map-command-rail" data-map-no-pan aria-label={t('map.commandRail.aria')}>
      <div className="map-command-rail__ambient" aria-hidden="true">
        <div className="map-command-rail__grid" />
        <div className="map-command-rail__scan" />
      </div>

      <header className="map-command-rail__head">
        <span className="map-command-rail__tag">{t('map.commandRail.tag')}</span>
        <p className="map-command-rail__sub">{t('map.commandRail.sub')}</p>
      </header>

      <div className="map-command-rail__intel">
        <MapIntelSidebar layout="rail" />
      </div>

      <div className="map-command-rail__minimap">
        <span className="map-command-rail__minimap-label">{t('map.commandRail.minimap')}</span>
        <MapMiniMap viewport={viewport} activeCity={activeCity} mapCities={mapCities} />
      </div>
    </aside>
  );
}
