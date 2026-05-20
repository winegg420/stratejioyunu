import { GeoJSON } from 'react-leaflet';

/** Komşu ülkeler — Türkiye dışı alanları soluk gri (siyah değil). Koordinatlar [lng, lat]. */
const NEIGHBOR_GEO = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Yunanistan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [23.0, 34.5], [26.8, 34.5], [27.2, 38.5], [26.0, 41.2], [24.0, 41.5],
          [23.0, 40.5], [22.5, 38.0], [23.0, 34.5],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Bulgaristan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [26.0, 41.0], [29.5, 41.0], [29.5, 44.5], [26.0, 44.5], [26.0, 41.0],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Gürcistan / Ermenistan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [42.5, 40.5], [46.5, 40.5], [46.5, 43.5], [42.5, 43.5], [42.5, 40.5],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Suriye / Irak' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [36.0, 35.0], [45.0, 35.0], [45.0, 37.8], [36.0, 37.8], [36.0, 35.0],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'İran (doğu)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [44.5, 37.5], [48.0, 37.5], [48.0, 40.0], [44.5, 40.0], [44.5, 37.5],
        ]],
      },
    },
  ],
};

const NEIGHBOR_STYLE = {
  fillColor: '#3d4a5c',
  fillOpacity: 0.55,
  color: '#5a6b7d',
  weight: 1,
  opacity: 0.65,
};

export default function NeighborCountriesLayer() {
  return (
    <GeoJSON
      data={NEIGHBOR_GEO}
      style={() => NEIGHBOR_STYLE}
      interactive={false}
      className="map-neighbor-layer"
    />
  );
}
