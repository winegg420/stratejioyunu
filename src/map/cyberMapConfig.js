export const CARTO_DARK_MATTER_URL =
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export const ROUTE_STYLES = {
  attack: {
    color: '#facc15',
    dashArray: '14, 5',
    weight: 8,
    className: 'cyber-route tactical-route tactical-route-beam tactical-route--attack cyber-route--attack',
  },
  spy: {
    color: '#facc15',
    dashArray: '6, 12',
    className: 'cyber-route tactical-route tactical-route-beam tactical-route--spy cyber-route--spy',
  },
  return: {
    color: '#22ff88',
    dashArray: '10, 12',
    className: 'cyber-route tactical-route tactical-route-beam tactical-route--return cyber-route--return',
  },
  found: {
    color: '#38bdf8',
    dashArray: '8, 14',
    className: 'cyber-route tactical-route tactical-route-beam tactical-route--found cyber-route--found',
  },
  trade: {
    color: '#4a7c59',
    dashArray: '5, 10',
    className: 'cyber-route tactical-route tactical-route-beam tactical-route--trade cyber-route--trade',
  },
};

export const FOG_FILL = { fillColor: '#0a0f0a', fillOpacity: 0.88, stroke: false };

export const VISION_RADIUS_DEG = 1.65;
export const SPY_VISION_RADIUS_DEG = 2.4;
export const EXPEDITION_VISION_RADIUS_DEG = 1.1;

export const TURKEY_FOG_OUTER = [
  [35.2, 25.2],
  [35.2, 45.2],
  [42.8, 45.2],
  [42.8, 25.2],
];

export function inferCityTier(city) {
  if (city.tier) return city.tier;
  const pop = city.population ?? 0;
  const type = (city.type || '').toLowerCase();
  if (type.includes('başkent') || type.includes('baskent') || pop >= 40000) return 'capital';
  if (type.includes('büyük') || type.includes('buyuk') || pop >= 12000) return 'metropolis';
  return 'town';
}
