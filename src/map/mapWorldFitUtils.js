import L from 'leaflet';
import { MAP_GEO } from './mapGeoConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';

export function getMapWorldBounds() {
  const { south, north, west, east } = MAP_GEO.bounds;
  return L.latLngBounds([south, west], [north, east]);
}

/** Oyun görünümü — kutup boşluklarını kırpar, dünya daha büyük görünür */
export function getMapGameplayBounds() {
  const { south, west, east } = MAP_GEO.bounds;
  const northCap = MAP_GEO.gameplayNorth ?? 72;
  const southCap = MAP_GEO.gameplaySouth ?? south;
  return L.latLngBounds([southCap, west], [northCap, east]);
}

function boundsPixelSize(map, bounds, zoom) {
  const sw = map.project(bounds.getSouthWest(), zoom);
  const ne = map.project(bounds.getNorthEast(), zoom);
  return {
    w: Math.abs(ne.x - sw.x),
    h: Math.abs(ne.y - sw.y),
  };
}

/** @deprecated Yalnızca eski Türkiye modu — dünya haritasında kullanılmaz */
export function computeViewportFillZoom(map, padding = 8) {
  const bounds = getMapGameplayBounds();
  const size = map.getSize();
  if (size.x < 64 || size.y < 64) return MAP_GEO.minZoom;

  const targetW = size.x - padding * 2;
  const targetH = size.y - padding * 2;
  const maxZ = Math.min(MAP_GEO.maxZoom, 6);

  for (let z = MAP_GEO.minZoom; z <= maxZ; z += 1) {
    const px = boundsPixelSize(map, bounds, z);
    if (px.w >= targetW && px.h >= targetH) {
      return Math.max(MAP_GEO.minZoom, z);
    }
  }
  return maxZ;
}

/** Dünya haritası — sabit zoom aralığı (kullanıcı uzaklaştırabilir) */
export function applyWorldMapZoomPolicy(map) {
  map.setMinZoom(MAP_GEO.minZoom);
  map.setMaxZoom(MAP_GEO.maxZoom);
}

/** Dünya modunda dinamik minZoom yok; Türkiye modunda eski davranış */
export function applyViewportZoomLimits(map, padding = 8) {
  if (IS_WORLD_MAP) {
    applyWorldMapZoomPolicy(map);
    return MAP_GEO.minZoom;
  }
  const minZ = computeViewportFillZoom(map, padding);
  map.setMinZoom(minZ);
  if (map.getZoom() < minZ) {
    map.setZoom(minZ, { animate: false });
  }
  return minZ;
}

/** Dünya sınırlarına sığdır — max zoom 2 (tüm dünya) */
export function fitMapWorld(map, { padding = 20, isFullscreen = false } = {}) {
  const bounds = getMapGameplayBounds();
  const side = isFullscreen ? 10 : Math.max(8, Math.round(padding * 0.55));
  const vert = isFullscreen ? 8 : Math.max(6, Math.round(padding * 0.35));
  const overviewZoom = MAP_GEO.worldOverviewZoom ?? 2;

  map.invalidateSize({ animate: false, pan: false });
  map.fitBounds(bounds, {
    paddingTopLeft: L.point(side, vert),
    paddingBottomRight: L.point(side, vert),
    maxZoom: overviewZoom,
    animate: false,
  });
  applyWorldMapZoomPolicy(map);
}

/** Merkez + zoom 2 — dünya genel bakış */
export function setMapWorldOverview(map) {
  const overviewZoom = MAP_GEO.worldOverviewZoom ?? 2;
  map.invalidateSize({ animate: false, pan: false });
  map.setView(MAP_GEO.center, overviewZoom, { animate: false });
  applyWorldMapZoomPolicy(map);
}
