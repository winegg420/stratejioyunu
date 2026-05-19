export const CITY_STATUS_COLORS = {
  own: '#22ff88',
  enemy: '#ef4444',
  empty: '#64748b',
  vassal: '#eab308',
  bot: '#94a3b8',
  siege: '#f97316',
};

export function getCityMarkerStyle(status) {
  if (status === 'own') {
    return {
      color: '#ecfeff',
      weight: 2.5,
      fillColor: '#2dd4bf',
      fillOpacity: 1,
      radius: 10,
    };
  }
  if (status === 'empty') {
    return {
      color: '#475569',
      weight: 1,
      fillColor: '#64748b',
      fillOpacity: 0.55,
      radius: 6,
    };
  }
  return {
    color: '#fff',
    weight: 1,
    fillColor: CITY_STATUS_COLORS[status] || CITY_STATUS_COLORS.enemy,
    fillOpacity: 0.9,
    radius: 8,
  };
}

export const MAP_BORDER_STYLE = {
  color: 'rgba(0, 240, 255, 0.4)',
  weight: 1.2,
  lineJoin: 'round',
  lineCap: 'round',
};

export function getProvinceStyle() {
  return {
    fillColor: '#0a1220',
    fillOpacity: 0.5,
    ...MAP_BORDER_STYLE,
  };
}

export function getDistrictStyle() {
  return {
    fillColor: '#0d1525',
    fillOpacity: 0.62,
    ...MAP_BORDER_STYLE,
  };
}

export function getHoverStyle(base) {
  return { ...base, fillOpacity: (base.fillOpacity || 0.35) + 0.2, weight: 2.5 };
}
