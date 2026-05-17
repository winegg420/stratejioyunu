import { Circle } from 'react-leaflet';

const RANGE_METERS = 250000;

const RANGE_STYLE = {
  color: '#22ff88',
  weight: 1,
  fillColor: '#22ff88',
  fillOpacity: 0.05,
  opacity: 0.85,
};

export default function ActiveCityRangeLayer({ lat, lng }) {
  if (lat == null || lng == null) return null;

  return (
    <Circle
      center={[lat, lng]}
      radius={RANGE_METERS}
      pathOptions={RANGE_STYLE}
    />
  );
}
