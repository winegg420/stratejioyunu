import { useMemo } from 'react';
import { CircleMarker } from 'react-leaflet';
import { progressFromTiming } from '../lib/gameUtils';
import { shouldDrawExpeditionRoute } from './mapRouteUtils';

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

function lerpCoord(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const MODE_COLORS = {
  attack: '#22d3ee',
  trade: '#fbbf24',
  spy: '#facc15',
  cyber: '#60a5fa',
  cargo: '#a3e635',
  return: '#4ade80',
  default: '#22d3ee',
};

function colorForExpedition(exp) {
  if (exp.mode === 'trade' || exp.mode === 'cargo') return MODE_COLORS.trade;
  if (exp.mode === 'spy' || exp.mode === 'cyber') return MODE_COLORS.spy;
  if (exp.direction === 'returning' || exp.recalled) return MODE_COLORS.return;
  return MODE_COLORS.attack;
}

/** Aktif seferler — rota üzerinde ilerleyen birim + hedef ülke nabız */
export default function ExpeditionProgressMarkers({
  expeditions,
  mapCities,
  playerCities,
  now,
}) {
  const { markers, destinations } = useMemo(() => {
    const progressMarkers = [];
    const destByKey = new Map();

    for (const exp of expeditions ?? []) {
      const originPc = playerCities.find((p) => p.id === exp.originCityId);
      const isReturn = exp.direction === 'returning' || exp.recalled;
      const home = resolveCoords(originPc?.name, mapCities, playerCities, exp.originCityId)
        ?? (originPc?.lat != null && originPc?.lng != null ? [originPc.lat, originPc.lng] : null);
      const enemyName = isReturn ? (exp.originalTarget ?? exp.target) : exp.target;
      if (!shouldDrawExpeditionRoute(exp, mapCities, enemyName)) continue;

      const enemy = resolveCoords(enemyName, mapCities, playerCities, exp.originCityId)
        ?? (exp.targetLat != null && exp.targetLng != null ? [exp.targetLat, exp.targetLng] : null);
      if (!home || !enemy) continue;

      const color = colorForExpedition(exp);

      if (!isReturn) {
        destByKey.set(enemyName, { name: enemyName, pos: enemy, color });
      }

      const from = isReturn ? enemy : home;
      const to = isReturn ? home : enemy;
      const progress = exp.endsAt
        ? progressFromTiming(exp.startedAt, exp.endsAt, now)
        : 0;
      const t = isReturn ? 1 - progress : progress;
      const pos = lerpCoord(from, to, Math.min(1, Math.max(0, t)));

      progressMarkers.push({
        id: exp.id,
        pos,
        color,
        isReturn,
      });
    }

    return {
      markers: progressMarkers,
      destinations: [...destByKey.values()],
    };
  }, [expeditions, mapCities, playerCities, now]);

  return (
    <>
      {destinations.map((d) => (
        <CircleMarker
          key={`exp-dest-${d.name}`}
          center={d.pos}
          radius={16}
          pathOptions={{
            color: d.color,
            fillColor: d.color,
            fillOpacity: 0.2,
            weight: 2,
            className: 'expedition-destination-pulse',
          }}
          interactive={false}
        />
      ))}
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={m.pos}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            fillColor: m.color,
            fillOpacity: 0.95,
            weight: 2.5,
            className: `expedition-progress-marker${m.isReturn ? ' expedition-progress-marker--return' : ''}`,
          }}
        />
      ))}
    </>
  );
}
