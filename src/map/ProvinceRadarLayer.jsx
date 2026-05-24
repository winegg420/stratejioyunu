import { memo, useCallback, useEffect, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import { resolveProvinceLayerStyle } from '../lib/botProvincePulse';
import { getHoverStyle, getProvinceStyle } from './mapUtils';

/**
 * Türkiye il poligonları — GeoJSON tek mount; kendi iller yeşil, bot illeri kırmızı.
 */
function ProvinceRadarLayer({
  provinces,
  botProvinceNames,
  ownProvinceNames,
  onEachFeature,
  layerRef,
}) {
  const layersRef = useRef(new Map());
  const botNamesRef = useRef(botProvinceNames);
  const ownNamesRef = useRef(ownProvinceNames);
  const onEachRef = useRef(onEachFeature);

  botNamesRef.current = botProvinceNames;
  ownNamesRef.current = ownProvinceNames;
  onEachRef.current = onEachFeature;

  const applyBaseStyle = useCallback((name, layer) => {
    layer.setStyle(resolveProvinceLayerStyle(
      name,
      ownNamesRef.current,
      botNamesRef.current,
    ));
  }, []);

  const stableStyle = useCallback((feature) => {
    const name = feature?.properties?.shapeName;
    return resolveProvinceLayerStyle(name, ownProvinceNames, botProvinceNames);
  }, [ownProvinceNames, botProvinceNames]);

  const attachFeature = useCallback((feature, layer) => {
    const name = feature.properties?.shapeName;
    if (name) layersRef.current.set(name, layer);
    applyBaseStyle(name, layer);
    onEachRef.current?.(feature, layer);
  }, [applyBaseStyle]);

  useEffect(() => {
    botNamesRef.current = botProvinceNames;
    ownNamesRef.current = ownProvinceNames;
    for (const [name, layer] of layersRef.current) {
      applyBaseStyle(name, layer);
    }
  }, [botProvinceNames, ownProvinceNames, applyBaseStyle]);

  useEffect(() => () => layersRef.current.clear(), []);

  const bindLayerGroup = useCallback((group) => {
    if (layerRef) layerRef.current = group;
  }, [layerRef]);

  if (!provinces) return null;

  return (
    <GeoJSON
      ref={bindLayerGroup}
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
  const base = layer?.options ?? getProvinceStyle();
  layer.setStyle(getHoverStyle(base));
}

export function resetProvinceHover(layer, activeLayer, botProvinceNames, ownProvinceNames) {
  if (activeLayer === layer) return;
  const name = layer?.feature?.properties?.shapeName;
  layer.setStyle(resolveProvinceLayerStyle(name, ownProvinceNames, botProvinceNames));
  return name;
}
