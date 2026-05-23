import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { findProvinceFeature } from './cityProvinceMatch';
import { provinceCodesMatch } from './mapOwnership';
import { getProvinceStyle } from './mapUtils';

const ACTIVE_STYLE = {
  fillColor: '#4a7c59',
  fillOpacity: 0.22,
  color: '#4a7c59',
  weight: 3.2,
  opacity: 1,
  lineJoin: 'round',
  lineCap: 'round',
};

/** setActiveFeature(layer) — il GeoJSON katmanında tek seçili polygon */
export default function ProvinceHighlightSync({
  activeCity,
  provinces,
  playerCities,
  layerRef,
}) {
  const map = useMap();
  const activeLayerRef = useRef(null);

  useEffect(() => {
    const resetLayer = (layer) => {
      if (layer?.setStyle) layer.setStyle(getProvinceStyle());
    };

    if (activeLayerRef.current) {
      resetLayer(activeLayerRef.current);
      activeLayerRef.current = null;
    }

    const group = layerRef?.current;
    if (!group || !activeCity || !provinces) return undefined;

    const feature = findProvinceFeature(provinces, activeCity, playerCities);
    if (!feature) return undefined;

    const iso = feature.properties?.shapeISO;
    const shapeName = feature.properties?.shapeName;
    let matched = null;
    group.eachLayer((layer) => {
      const layerIso = layer.feature?.properties?.shapeISO;
      const layerName = layer.feature?.properties?.shapeName;
      if (iso && provinceCodesMatch(layerIso, iso)) {
        matched = layer;
        return;
      }
      if (!matched && shapeName && layerName === shapeName) {
        matched = layer;
      }
    });

    if (matched) {
      matched.setStyle(ACTIVE_STYLE);
      matched.bringToFront();
      activeLayerRef.current = matched;
    }

    return () => {
      if (activeLayerRef.current) {
        resetLayer(activeLayerRef.current);
        activeLayerRef.current = null;
      }
    };
  }, [map, activeCity, provinces, playerCities, layerRef]);

  return null;
}

export function setActiveProvinceLayer(layer, activeLayerRef, resetStyle = getProvinceStyle) {
  if (activeLayerRef.current && activeLayerRef.current !== layer) {
    activeLayerRef.current.setStyle(resetStyle());
  }
  activeLayerRef.current = layer;
  if (layer) {
    layer.setStyle(ACTIVE_STYLE);
    layer.bringToFront();
  }
}
