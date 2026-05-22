import L from 'leaflet';

const DOT_COUNT = 3;
const PHASE_STEP = 0.009;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** İki uçlu sefer hattı üzerinde faz (0–1) konumu. */
export function pointAlongRoute(positions, phase) {
  const [[lat0, lng0], [lat1, lng1]] = positions;
  const t = ((phase % 1) + 1) % 1;
  return [lerp(lat0, lat1, t), lerp(lng0, lng1, t)];
}

export function createRouteNeonDots(map, route) {
  const dots = [];
  for (let i = 0; i < DOT_COUNT; i += 1) {
    const phase = i / DOT_COUNT;
    const [lat, lng] = pointAlongRoute(route.positions, phase);
    const marker = L.circleMarker([lat, lng], {
      radius: 4,
      fillColor: route.color,
      fillOpacity: 0.95,
      color: '#ffffff',
      weight: 1,
      opacity: 0.85,
      className: `tactical-route-neon-dot tactical-route-neon-dot--${i}`,
      interactive: false,
    });
    marker.__routePhase = phase;
    marker.__routePositions = route.positions;
    marker.__routeColor = route.color;
    marker.addTo(map);
    dots.push(marker);
  }
  return dots;
}

export function tickRouteNeonDots(dots) {
  for (const marker of dots) {
    marker.__routePhase = (marker.__routePhase + PHASE_STEP) % 1;
    const [lat, lng] = pointAlongRoute(marker.__routePositions, marker.__routePhase);
    marker.setLatLng([lat, lng]);
  }
}

export function removeRouteNeonDots(map, dots) {
  for (const marker of dots) {
    if (map?.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  }
}
