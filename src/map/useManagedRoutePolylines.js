import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { isCleansedGhostEndpoint } from './mapRouteUtils';
import {
  createRouteNeonDots,
  removeRouteNeonDots,
  tickRouteNeonDots,
} from './routeNeonDots';

function routePathOptions(route) {
  return {
    color: route.color,
    weight: 4.5,
    opacity: 1,
    dashArray: route.dashArray,
    dashOffset: '0',
    lineCap: 'round',
    lineJoin: 'round',
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
  const dotsRef = useRef(new Map());

  useEffect(() => {
    if (!map || routeSyncRev === 0) return;
    layersRef.current.forEach((layer, id) => {
      const endpoint = layer.__routeEndpoint;
      if (endpoint && isCleansedGhostEndpoint(mapCities, endpoint)) {
        removeLayerFromMap(map, layer);
        layersRef.current.delete(id);
        const dots = dotsRef.current.get(id);
        if (dots) {
          removeRouteNeonDots(map, dots);
          dotsRef.current.delete(id);
        }
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
        const dots = dotsRef.current.get(id);
        if (dots) {
          removeRouteNeonDots(map, dots);
          dotsRef.current.delete(id);
        }
      }
    });

    for (const route of routes) {
      const latlngs = route.positions.map(([lat, lng]) => L.latLng(lat, lng));
      let layer = layersRef.current.get(route.id);

      if (!layer) {
        layer = L.polyline(latlngs, routePathOptions(route));
        layer.__routeEndpoint = route.endpointName;
        layer.addTo(map);
        if (typeof layer.bringToFront === 'function') {
          layer.bringToFront();
        }
        layersRef.current.set(route.id, layer);
        dotsRef.current.set(route.id, createRouteNeonDots(map, route));
      } else {
        layer.setLatLngs(latlngs);
        layer.setStyle(routePathOptions(route));
        layer.__routeEndpoint = route.endpointName;
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
        if (typeof layer.bringToFront === 'function') {
          layer.bringToFront();
        }
        let dots = dotsRef.current.get(route.id);
        if (!dots?.length) {
          dots = createRouteNeonDots(map, route);
          dotsRef.current.set(route.id, dots);
        } else {
          for (const marker of dots) {
            marker.__routePositions = route.positions;
            marker.__routeColor = route.color;
            marker.setStyle({
              fillColor: route.color,
              color: '#ffffff',
            });
          }
        }
      }
    }

    return undefined;
  }, [map, routes, mapCities, routeSyncRev]);

  useEffect(() => {
    if (!map || routes.length === 0) return undefined;
    const intervalId = window.setInterval(() => {
      dotsRef.current.forEach((dots) => tickRouteNeonDots(dots));
    }, 48);
    return () => window.clearInterval(intervalId);
  }, [map, routes.length]);

  useEffect(() => {
    if (!map) return undefined;
    return () => {
      layersRef.current.forEach((layer) => removeLayerFromMap(map, layer));
      layersRef.current.clear();
      dotsRef.current.forEach((dots) => removeRouteNeonDots(map, dots));
      dotsRef.current.clear();
    };
  }, [map]);
}
