export function offsetRoutePositions(positions, index, total) {
  if (!positions || positions.length < 2 || total <= 1) return positions;

  const [from, to] = positions;
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
  const perpLat = (-dLng / len) * 0.06;
  const perpLng = (dLat / len) * 0.06;
  const shift = index - (total - 1) / 2;

  return [
    [from[0] + perpLat * shift, from[1] + perpLng * shift],
    [to[0] + perpLat * shift, to[1] + perpLng * shift],
  ];
}

export function groupRoutesByTarget(routes) {
  const groups = new Map();
  for (const route of routes) {
    const key = `${route.positions[1][0].toFixed(3)},${route.positions[1][1].toFixed(3)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(route);
  }
  return groups;
}
