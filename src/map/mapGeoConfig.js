/**
 * Harita coğrafya yapılandırması — dünya (ülke) modu.
 * İl/şehir katmanı aynı GeoJSON sözleşmesini kullanır: shapeName, shapeISO.
 */

export const MAP_GEO_MODE = 'world';

export const MAP_GEO = {
  mode: MAP_GEO_MODE,
  geoUrl: '/geo/countries.json',
  /** Leaflet başlangıç — tüm dünya genel bakış */
  center: [20, 0],
  zoom: 2,
  /** Tam dünya görünümü (maxBounds ile uyumlu) */
  minZoom: 1,
  maxZoom: 7,
  /** Görünür dünya kutusu — maxBounds güney −60° (Antarktika / güney kutup boşluğu) */
  bounds: {
    south: -60,
    north: 76,
    west: -170,
    east: 170,
  },
  /** fitBounds — oyun alanı güney kesimi */
  gameplaySouth: -60,
  gameplayNorth: 66,
  territoryLabel: 'ülke',
  /** Ülke seçiminde yakınlaştırma */
  countryFocusZoom: 5,
  /** Tam dünya görünümü */
  /** Gerçek zoom MapViewportMinZoom ile sabit min/max (1–7) */
  worldOverviewZoom: 3,
  /** Sefer süresi üst sınırı (dünya ölçeği — birkaç saat) */
  maxLandExpeditionSeconds: 5 * 3600,
};

/** @deprecated Türkiye-only — geriye uyumluluk alias */
export const LEGACY_TURKEY_GEO_URL = '/geo/provinces.json';
