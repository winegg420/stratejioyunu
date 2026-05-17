export const CITY_STATUS_COLORS = {
  own: '#3b82f6',
  enemy: '#ef4444',
  empty: '#22c55e',
  vassal: '#eab308',
  bot: '#9ca3af',
  siege: '#f97316',
};

export function getProvinceStyle() {
  return {
    fillColor: '#1e3a5f',
    fillOpacity: 0.35,
    color: '#4a7ab8',
    weight: 1.5,
  };
}

export function getDistrictStyle() {
  return {
    fillColor: '#2d5a3d',
    fillOpacity: 0.45,
    color: '#6bcf8a',
    weight: 1,
  };
}

export function getHoverStyle(base) {
  return { ...base, fillOpacity: (base.fillOpacity || 0.35) + 0.2, weight: 2.5 };
}
