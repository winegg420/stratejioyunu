import { MAP_GEO } from './mapGeoConfig';

/** Zoom ≥ bu değerde şehir/ülke isimleri görünür; altında yalnızca renkli nokta */
export const MAP_ZOOM_LABEL_MIN = MAP_GEO.mode === 'world' ? 3 : 5;

/** Dünya modu — GeoJSON ülke adı etiketleri (nokta + isim) */
export const MAP_COUNTRY_LABEL_MIN = MAP_GEO.mode === 'world' ? 3 : 99;

/** Zoom ≥ bu değerde etkileşimli pin / reticle katmanları */
export const MAP_ZOOM_MARKER_MIN = MAP_GEO.mode === 'world' ? 5 : 4;
