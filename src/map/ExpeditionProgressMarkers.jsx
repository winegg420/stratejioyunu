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

/** Aktif seferler — rota üzerinde ilerleyen birim göstergesi */
export default function ExpeditionProgressMarkers({
  expeditions,
  mapCities,
  playerCities,
  now,
}) {
  const markers = useMemo(() => {
    return (expeditions ?? [])
      .map((exp) => {
        const originPc = playerCities.find((p) => p.id === exp.originCityId);
        const isReturn = exp.direction === 'returning' || exp.recalled;
        const home = resolveCoords(originPc?.name, mapCities, playerCities, exp.originCityId)
          ?? (originPc?.lat != null && originPc?.lng != null ? [originPc.lat, originPc.lng] : null);
        const enemyName = isReturn ? (exp.originalTarget ?? exp.target) : exp.target;
        if (!shouldDrawExpeditionRoute(exp, mapCities, enemyName)) return null;

        const enemy = resolveCoords(enemyName, mapCities, playerCities, exp.originCityId)
          ?? (exp.targetLat != null && exp.targetLng != null ? [exp.targetLat, exp.targetLng] : null);
        if (!home || !enemy) return null;

        const from = isReturn ? enemy : home;
        const to = isReturn ? home : enemy;
        const progress = exp.endsAt
          ? progressFromTiming(exp.startedAt, exp.endsAt, now)
          : 0;
        const t = isReturn ? 1 - progress : progress;
        const pos = lerpCoord(from, to, Math.min(1, Math.max(0, t)));

        return {
          id: exp.id,
          pos,
          color: colorForExpedition(exp),
          isReturn,
        };
      })
      .filter(Boolean);
  }, [expeditions, mapCities, playerCities, now]);

  return (
    <>
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
