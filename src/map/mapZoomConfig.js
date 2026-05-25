import { MAP_GEO } from './mapGeoConfig';

/** Zoom ≥ bu değerde şehir isimleri görünür; altında yalnızca renkli nokta */
export const MAP_ZOOM_LABEL_MIN = MAP_GEO.mode === 'world' ? 4 : 5;

/** Zoom ≥ bu değerde etkileşimli pin / reticle katmanları */
export const MAP_ZOOM_MARKER_MIN = MAP_GEO.mode === 'world' ? 5 : 4;
