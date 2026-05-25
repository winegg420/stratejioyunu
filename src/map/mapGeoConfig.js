/**
 * Harita coğrafya yapılandırması — dünya (ülke) modu.
 * İl/şehir katmanı aynı GeoJSON sözleşmesini kullanır: shapeName, shapeISO.
 */

export const MAP_GEO_MODE = 'world';

export const MAP_GEO = {
  mode: MAP_GEO_MODE,
  geoUrl: '/geo/countries.json',
  /** Leaflet başlangıç */
  center: [24, 12],
  zoom: 2,
  minZoom: 2,
  maxZoom: 7,
  /** Görünür dünya kutusu */
  bounds: {
    south: -58,
    north: 82,
    west: -170,
    east: 170,
  },
  territoryLabel: 'ülke',
  /** Ülke seçiminde yakınlaştırma */
  countryFocusZoom: 5,
  /** Tam dünya görünümü */
  worldOverviewZoom: 2,
  /** Sefer süresi üst sınırı (dünya ölçeği — birkaç saat) */
  maxLandExpeditionSeconds: 5 * 3600,
};

/** @deprecated Türkiye-only — geriye uyumluluk alias */
export const LEGACY_TURKEY_GEO_URL = '/geo/provinces.json';
