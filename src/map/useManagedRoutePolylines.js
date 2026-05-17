import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { isCleansedGhostEndpoint } from './mapRouteUtils';

function routePathOptions(route) {
  return {
    color: route.color,
    weight: 3,
    opacity: 0.92,
    dashArray: route.dashArray,
    lineCap: 'round',
    className: route.className,
  };
}

function removeLayerFromMap(map, layer) {
  if (!map || !layer) return;
  if (map.hasLayer(layer)) {
    map.removeLayer(layer);
  }
}

/** Leaflet polyline örneklerini map.removeLayer ile canlı senkronize eder. */
export function useManagedRoutePolylines(map, routes, mapCities, routeSyncRev = 0) {
  const layersRef = useRef(new Map());

  useEffect(() => {
    if (!map || routeSyncRev === 0) return;
    layersRef.current.forEach((layer, id) => {
      const endpoint = layer.__routeEndpoint;
      if (endpoint && isCleansedGhostEndpoint(mapCities, endpoint)) {
        removeLayerFromMap(map, layer);
        layersRef.current.delete(id);
      }
    });
  }, [map, mapCities, routeSyncRev]);

  useEffect(() => {
    if (!map) return undefined;

    const activeIds = new Set(routes.map((r) => r.id));

    layersRef.current.forEach((layer, id) => {
      if (!activeIds.has(id)) {
        removeLayerFromMap(map, layer);
        layersRef.current.delete(id);
      }
    });

    for (const route of routes) {
      const latlngs = route.positions.map(([lat, lng]) => L.latLng(lat, lng));
      let layer = layersRef.current.get(route.id);

      if (!layer) {
        layer = L.polyline(latlngs, routePathOptions(route));
        layer.__routeEndpoint = route.endpointName;
        layer.addTo(map);
        layersRef.current.set(route.id, layer);
      } else {
        layer.setLatLngs(latlngs);
        layer.setStyle(routePathOptions(route));
        layer.__routeEndpoint = route.endpointName;
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
      }
    }

    return undefined;
  }, [map, routes, mapCities]);

  useEffect(() => {
    if (!map) return undefined;
    return () => {
      layersRef.current.forEach((layer) => removeLayerFromMap(map, layer));
      layersRef.current.clear();
    };
  }, [map]);
}
