import { extractCityFromReportTitle } from '../lib/spyIntel';
import {
  EXPEDITION_VISION_RADIUS_DEG,
  SPY_VISION_RADIUS_DEG,
  TURKEY_FOG_OUTER,
  VISION_RADIUS_DEG,
} from './cyberMapConfig';

function circleHole(lat, lng, radiusDeg, points = 20) {
  const ring = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    ring.push([lat + Math.cos(angle) * radiusDeg, lng + Math.sin(angle) * radiusDeg]);
  }
  return ring;
}

export function getVisionZones({ playerCities, mapCities, expeditions, reports }) {
  const zones = [];
  const add = (lat, lng, radius) => {
    if (lat == null || lng == null) return;
    zones.push({ lat, lng, radius });
  };

  const findMapCity = (name) => mapCities.find((c) => c.name === name);

  for (const pc of playerCities) {
    const mc = findMapCity(pc.name) || mapCities.find((c) => c.status === 'own');
    if (mc) add(mc.lat, mc.lng, VISION_RADIUS_DEG);
  }

  for (const exp of expeditions) {
    const originPc = playerCities.find((p) => p.id === exp.originCityId);
    const originMc = originPc ? findMapCity(originPc.name) : null;
    if (originMc) add(originMc.lat, originMc.lng, VISION_RADIUS_DEG * 0.85);

    const targetName = exp.direction === 'returning'
      ? (exp.originalTarget ?? exp.target)
      : exp.target;
    const targetMc = findMapCity(targetName);
    if (targetMc) add(targetMc.lat, targetMc.lng, EXPEDITION_VISION_RADIUS_DEG);
    if (exp.direction === 'returning' && originPc) {
      const homeMc = findMapCity(originPc.name);
      if (homeMc) add(homeMc.lat, homeMc.lng, EXPEDITION_VISION_RADIUS_DEG);
    }
  }

  for (const r of reports) {
    if (r.filterType !== 'spy' || !r.intelSuccess) continue;
    const cityName = r.targetCity || extractCityFromReportTitle(r.title);
    const mc = findMapCity(cityName);
    if (mc) add(mc.lat, mc.lng, SPY_VISION_RADIUS_DEG);
  }

  return zones;
}

export function buildFogPolygonPositions(zones) {
  const holes = zones.map((z) => circleHole(z.lat, z.lng, z.radius));
  if (!holes.length) return [TURKEY_FOG_OUTER];
  return [TURKEY_FOG_OUTER, ...holes];
}
