import { GeoJSON } from 'react-leaflet';

/** Türkiye dışı — genişletilmiş maske (batı Yunanistan, doğu İran). Koordinatlar [lng, lat]. */
const NEIGHBOR_GEO = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Batı — Yunanistan / Ege' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [18.5, 33.5], [27.5, 33.5], [28.0, 38.0], [27.0, 42.8], [24.5, 43.2],
          [22.0, 42.0], [19.0, 40.0], [18.5, 36.0], [18.5, 33.5],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Kuzey — Bulgaristan / Karadeniz' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [25.5, 42.0], [32.0, 42.0], [32.5, 44.8], [25.5, 44.8], [25.5, 42.0],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Doğu — Kafkasya / İran' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [42.0, 37.0], [50.0, 37.0], [50.0, 43.5], [42.0, 43.5], [42.0, 37.0],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Güney — Suriye / Irak' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [34.0, 33.5], [48.5, 33.5], [48.5, 37.5], [34.0, 37.5], [34.0, 33.5],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Güneydoğu — Basra hattı' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [42.5, 33.5], [50.0, 33.5], [50.0, 37.0], [42.5, 37.0], [42.5, 33.5],
        ]],
      },
    },
  ],
};

const NEIGHBOR_STYLE = {
  fillColor: '#2a323c',
  fillOpacity: 0.72,
  color: 'rgba(55, 65, 81, 0.55)',
  weight: 0.6,
  opacity: 0.92,
};

export default function NeighborCountriesLayer() {
  return (
    <GeoJSON
      data={NEIGHBOR_GEO}
      style={() => NEIGHBOR_STYLE}
      interactive={false}
      className="map-neighbor-layer map-neighbor-layer--mask"
    />
  );
}
