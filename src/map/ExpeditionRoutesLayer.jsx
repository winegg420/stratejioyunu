import { useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { buildExpeditionRoutes } from './expeditionRouteModel';
import { useManagedRoutePolylines } from './useManagedRoutePolylines';

export default function ExpeditionRoutesLayer({
  expeditions,
  mapCities,
  playerCities,
  routeSyncRev = 0,
}) {
  const map = useMap();

  const routes = useMemo(
    () => buildExpeditionRoutes(expeditions, mapCities, playerCities),
    [expeditions, mapCities, playerCities],
  );

  useManagedRoutePolylines(map, routes, mapCities, routeSyncRev);

  return null;
}
