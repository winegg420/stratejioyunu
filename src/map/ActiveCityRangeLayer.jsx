import { Circle } from 'react-leaflet';

const RANGE_METERS = 250000;

const RANGE_STYLE = {
  color: '#4a7c59',
  weight: 1,
  fillColor: '#4a7c59',
  fillOpacity: 0.03,
  opacity: 0.75,
  dashArray: '5, 10',
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
