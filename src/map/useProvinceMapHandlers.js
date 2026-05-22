import { useCallback, useRef } from 'react';
import { enrichMapCityWithProvince, resolveCityProvinceName } from './cityProvinceMatch';
import { getHoverStyle, getProvinceStyle } from './mapUtils';
import { getBotProvinceStyle } from '../lib/botProvincePulse';
import { setActiveProvinceLayer } from './ProvinceHighlightSync';

/**
 * İl poligonu hover/tıklama — stabil onEachFeature (GeoJSON yeniden bağlanmaz).
 */
export function useProvinceMapHandlers({
  mapCities,
  playerCities,
  mapTargetPickRequest,
  fulfillMapTargetPick,
  navigate,
  handleSelectCity,
  setActiveHighlightCity,
  activeProvinceLayerRef,
  botProvinceNamesRef,
  botPulsePhaseRef,
}) {
  const handlersRef = useRef({});

  handlersRef.current = {
    mapCities,
    playerCities,
    mapTargetPickRequest,
    fulfillMapTargetPick,
    navigate,
    handleSelectCity,
    setActiveHighlightCity,
    activeProvinceLayerRef,
    botProvinceNamesRef,
    botPulsePhaseRef,
  };

  const findCityForProvince = useCallback((feature) => {
    const provinceName = feature.properties?.shapeName;
    if (!provinceName) return null;
    const { mapCities: cities, playerCities: pcs } = handlersRef.current;
    return cities.find(
      (c) => resolveCityProvinceName(c, pcs) === provinceName,
    ) ?? cities.find((c) => c.name === provinceName) ?? null;
  }, []);

  const setActiveFeature = useCallback((layer) => {
    setActiveProvinceLayer(
      layer,
      handlersRef.current.activeProvinceLayerRef,
      getProvinceStyle,
    );
  }, []);

  const onEachProvince = useCallback((feature, layer) => {
    const name = feature.properties?.shapeName;
    if (name) {
      layer.bindTooltip(name, { sticky: true, className: 'map-tooltip map-tooltip--cyber' });
    }

    const applyBaseStyle = () => {
      const h = handlersRef.current;
      if (name && h.botProvinceNamesRef?.current?.has(name)) {
        layer.setStyle(getBotProvinceStyle());
      } else {
        layer.setStyle(getProvinceStyle());
      }
    };

    layer.on('mouseover', () => {
      if (handlersRef.current.activeProvinceLayerRef.current !== layer) {
        const h = handlersRef.current;
        const base = name && h.botProvinceNamesRef?.current?.has(name)
          ? getBotProvinceStyle()
          : getProvinceStyle();
        layer.setStyle(getHoverStyle(base));
      }
    });
    layer.on('mouseout', applyBaseStyle);
    layer.on('click', () => {
      const h = handlersRef.current;
      const city = findCityForProvince(feature);
      if (city) {
        h.handleSelectCity(city);
      } else {
        h.setActiveHighlightCity({
          name: feature.properties?.shapeName ?? 'Bölge',
          provinceName: feature.properties?.shapeName,
          province: feature.properties?.shapeISO,
        });
      }
      setActiveProvinceLayer(layer, h.activeProvinceLayerRef, getProvinceStyle);
    });
  }, [findCityForProvince]);

  return { onEachProvince, findCityForProvince, setActiveFeature };
}
