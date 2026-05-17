import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { ROUTE_STYLES } from './cyberMapConfig';
import { groupRoutesByTarget, offsetRoutePositions } from './expeditionRouteOffset';

function resolveCoords(name, mapCities, playerCities, originCityId) {
  if (!name) return null;
  const direct = mapCities.find((c) => c.name === name);
  if (direct) return [direct.lat, direct.lng];

  const player = playerCities.find((p) => p.id === originCityId || p.name === name);
  if (player) {
    const own = mapCities.find((c) => c.name === player.name);
    if (own) return [own.lat, own.lng];
  }
  return null;
}

function getRouteStyle(exp) {
  if (exp.mode === 'trade') {
    return exp.direction === 'returning' || exp.recalled
      ? ROUTE_STYLES.return
      : ROUTE_STYLES.trade;
  }
  if (exp.direction === 'returning' || exp.recalled || exp.type === 'Geri Dönüş') {
    return ROUTE_STYLES.return;
  }
  if (exp.mode === 'found' || exp.type === 'Şehir Kur') {
    return ROUTE_STYLES.found;
  }
  if (exp.type?.toLowerCase().includes('casus')) {
    return ROUTE_STYLES.spy;
  }
  return ROUTE_STYLES.attack;
}

export default function ExpeditionRoutesLayer({ expeditions, mapCities, playerCities }) {
  const routes = useMemo(() => {
    return expeditions
      .map((exp) => {
        const originPc = playerCities.find((p) => p.id === exp.originCityId);
        const isReturn = exp.direction === 'returning' || exp.recalled;

        const homeName = originPc?.name;
        const enemyName = isReturn ? (exp.originalTarget ?? exp.target) : exp.target;

        const home = resolveCoords(homeName, mapCities, playerCities, exp.originCityId);
        const enemy = resolveCoords(enemyName, mapCities, playerCities, exp.originCityId);

        if (!home || !enemy) return null;

        const positions = isReturn ? [enemy, home] : [home, enemy];
        const style = getRouteStyle(exp);

        return {
          id: exp.id,
          positions,
          ...style,
        };
      })
      .filter(Boolean);
  }, [expeditions, mapCities, playerCities]);

  const offsetRoutes = useMemo(() => {
    const groups = groupRoutesByTarget(routes);
    const result = [];
    for (const group of groups.values()) {
      group.forEach((route, index) => {
        result.push({
          ...route,
          positions: offsetRoutePositions(route.positions, index, group.length),
        });
      });
    }
    return result;
  }, [routes]);

  return (
    <>
      {offsetRoutes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.positions}
          pathOptions={{
            color: route.color,
            weight: 3,
            opacity: 0.92,
            dashArray: route.dashArray,
            lineCap: 'round',
            className: route.className,
          }}
        />
      ))}
    </>
  );
}
