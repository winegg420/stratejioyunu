import { memo, useCallback, useEffect, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getBotProvinceStyle } from '../lib/botProvincePulse';
import { getHoverStyle, getProvinceStyle } from './mapUtils';

/**
 * Türkiye il poligonları — GeoJSON tek mount; bot illeri sabit kırmızı sınır.
 */
function ProvinceRadarLayer({
  provinces,
  botProvinceNames,
  onEachFeature,
}) {
  const layersRef = useRef(new Map());
  const botNamesRef = useRef(botProvinceNames);
  const onEachRef = useRef(onEachFeature);

  botNamesRef.current = botProvinceNames;
  onEachRef.current = onEachFeature;

  const stableStyle = useCallback(() => getProvinceStyle(), []);

  const attachFeature = useCallback((feature, layer) => {
    const name = feature.properties?.shapeName;
    if (name) layersRef.current.set(name, layer);
    if (name && botNamesRef.current.has(name)) {
      layer.setStyle(getBotProvinceStyle());
    }
    onEachRef.current?.(feature, layer);
  }, []);

  useEffect(() => {
    botNamesRef.current = botProvinceNames;
    for (const [name, layer] of layersRef.current) {
      if (botProvinceNames.has(name)) {
        layer.setStyle(getBotProvinceStyle());
      } else {
        layer.setStyle(getProvinceStyle());
      }
    }
  }, [botProvinceNames]);

  useEffect(() => () => layersRef.current.clear(), []);

  if (!provinces) return null;

  return (
    <GeoJSON
      data={provinces}
      className="map-province-layer"
      style={stableStyle}
      smoothFactor={1.5}
      onEachFeature={attachFeature}
    />
  );
}

export default memo(ProvinceRadarLayer);

export function applyProvinceHover(layer, activeLayer) {
  if (activeLayer === layer) return;
  layer.setStyle(getHoverStyle(getProvinceStyle()));
}

export function resetProvinceHover(layer, activeLayer, botProvinceNames) {
  if (activeLayer === layer) return;
  const name = layer?.feature?.properties?.shapeName;
  if (name && botProvinceNames?.has(name)) {
    layer.setStyle(getBotProvinceStyle());
  } else {
    layer.setStyle(getProvinceStyle());
  }
  return name;
}
