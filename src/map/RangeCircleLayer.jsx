import { Circle } from 'react-leaflet';
import { rangeCircleRadiusMeters } from '../lib/mapRange';

const RANGE_STYLE = {
  color: '#22ff88',
  fillColor: '#22ff88',
  fillOpacity: 0.04,
  weight: 1.75,
  opacity: 0.7,
  dashArray: '10 14',
  className: 'radar-range-circle radar-range-circle--military',
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
