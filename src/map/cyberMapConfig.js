export const CARTO_DARK_MATTER_URL =
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export const ROUTE_STYLES = {
  attack: { color: '#ff3355', dashArray: '10, 14', className: 'cyber-route cyber-route--attack' },
  spy: { color: '#facc15', dashArray: '6, 10', className: 'cyber-route cyber-route--spy' },
  return: { color: '#22ff88', dashArray: '12, 8', className: 'cyber-route cyber-route--return' },
  found: { color: '#38bdf8', dashArray: '8, 12', className: 'cyber-route cyber-route--found' },
  trade: { color: '#22d3ee', dashArray: '4, 8', className: 'cyber-route cyber-route--trade' },
};

export const FOG_FILL = { fillColor: '#030712', fillOpacity: 0.72, stroke: false };

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
