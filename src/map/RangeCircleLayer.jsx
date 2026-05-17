import { Circle } from 'react-leaflet';
import { rangeCircleRadiusMeters } from '../lib/mapRange';

const RANGE_STYLE = {
  color: '#22d3ee',
  fillColor: '#06b6d4',
  fillOpacity: 0.08,
  weight: 2,
  opacity: 0.55,
  className: 'radar-range-circle',
};

export default function RangeCircleLayer({ center }) {
  if (!center?.lat || !center?.lng) return null;

  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={rangeCircleRadiusMeters()}
      pathOptions={RANGE_STYLE}
    />
  );
}
