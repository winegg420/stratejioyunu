import { Marker } from 'react-leaflet';
import L from 'leaflet';

const RADAR_ICON_HTML = `
  <div class="active-city-radar" aria-hidden="true">
    <span class="active-city-radar__ring active-city-radar__ring--1"></span>
    <span class="active-city-radar__ring active-city-radar__ring--2"></span>
    <span class="active-city-radar__ring active-city-radar__ring--3"></span>
    <span class="active-city-radar__sweep"></span>
    <span class="active-city-radar__core"></span>
  </div>
`;

const radarIcon = L.divIcon({
  className: 'active-city-radar-leaflet',
  html: RADAR_ICON_HTML,
  iconSize: [140, 140],
  iconAnchor: [70, 70],
});

export default function ActiveCityRadarLayer({ center }) {
  if (center?.lat == null || center?.lng == null) return null;

  return (
    <Marker
      position={[center.lat, center.lng]}
      icon={radarIcon}
      zIndexOffset={-80}
      interactive={false}
    />
  );
}
