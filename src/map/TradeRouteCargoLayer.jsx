import { useMemo } from 'react';
import { CircleMarker } from 'react-leaflet';
import { progressFromTiming } from '../lib/gameUtils';

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

export default function TradeRouteCargoLayer({ expeditions, mapCities, playerCities, now }) {
  const markers = useMemo(() => {
    return expeditions
      .filter((e) => e.mode === 'trade')
      .map((exp) => {
        const originPc = playerCities.find((p) => p.id === exp.originCityId);
        const isReturn = exp.direction === 'returning' || exp.recalled;
        const home = resolveCoords(originPc?.name, mapCities, playerCities, exp.originCityId);
        const enemy = resolveCoords(
          isReturn ? (exp.originalTarget ?? exp.target) : exp.target,
          mapCities,
          playerCities,
          exp.originCityId,
        );
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
          radius={7}
          pathOptions={{
            color: '#22d3ee',
            fillColor: m.isReturn ? '#22ff88' : '#fbbf24',
            fillOpacity: 0.95,
            weight: 2,
            className: 'trade-cargo-marker',
          }}
        />
      ))}
    </>
  );
}
