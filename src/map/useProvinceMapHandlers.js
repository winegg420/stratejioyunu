import { useCallback, useRef } from 'react';
import L from 'leaflet';
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
  openMapCityPanel,
  onProvinceView,
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
    openMapCityPanel,
    onProvinceView,
    setActiveHighlightCity,
    activeProvinceLayerRef,
    botProvinceNamesRef,
    botPulsePhaseRef,
  };

  const findCityForProvince = useCallback((feature) => {
    try {
      const provinceName = feature?.properties?.shapeName;
      if (!provinceName) return null;
      const { mapCities: cities, playerCities: pcs } = handlersRef.current;
      if (!Array.isArray(cities)) return null;
      const norm = (s) => String(s ?? '').trim().toLocaleLowerCase('tr');
      const target = norm(provinceName);
      return cities.find((c) => {
        const pn = resolveCityProvinceName(c, pcs);
        return norm(pn) === target || norm(c.name) === target || norm(c.provinceName) === target;
      }) ?? cities.find((c) => c.name === provinceName) ?? null;
    } catch (err) {
      console.warn('[MAP_PROVINCE]', err);
      return null;
    }
  }, []);

  const setActiveFeature = useCallback((layer) => {
    setActiveProvinceLayer(
      layer,
      handlersRef.current.activeProvinceLayerRef,
      getProvinceStyle,
    );
  }, []);

  const onEachProvince = useCallback((feature, layer) => {
    try {
      if (!feature || !layer) return;
      const name = feature.properties?.shapeName;
      if (name) {
        layer.bindTooltip(name, {
          sticky: false,
          direction: 'top',
          offset: [0, -10],
          opacity: 0.96,
          className: 'map-tooltip map-tooltip--cyber',
        });
      }

      const applyBaseStyle = () => {
        try {
          const h = handlersRef.current;
          if (name && h.botProvinceNamesRef?.current?.has(name)) {
            layer.setStyle(getBotProvinceStyle());
          } else {
            layer.setStyle(getProvinceStyle());
          }
        } catch {
          /* layer disposed */
        }
      };

      layer.on('mouseover', (e) => {
        try {
          if (name) {
            const tip = layer.getTooltip?.();
            if (tip) {
              const anchor = e?.latlng ?? layer.getBounds?.()?.getCenter?.();
              if (anchor) layer.openTooltip(anchor);
              else layer.openTooltip();
            }
          }
          if (handlersRef.current.activeProvinceLayerRef.current !== layer) {
            const h = handlersRef.current;
            const base = name && h.botProvinceNamesRef?.current?.has(name)
              ? getBotProvinceStyle()
              : getProvinceStyle();
            layer.setStyle(getHoverStyle(base));
          }
        } catch {
          /* ignore */
        }
      });
      layer.on('mouseout', () => {
        try {
          layer.closeTooltip?.();
        } catch {
          /* ignore */
        }
        applyBaseStyle();
      });
      layer.on('click', (e) => {
        try {
          L.DomEvent.stopPropagation(e);
          e?.originalEvent?.stopPropagation?.();
          const h = handlersRef.current;
          const city = findCityForProvince(feature);
          const provinceName = feature.properties?.shapeName ?? 'Bölge';
          const center = layer.getBounds?.()?.getCenter?.();
          const highlight = city ?? {
            name: provinceName,
            provinceName,
            province: feature.properties?.shapeISO,
            lat: center?.lat,
            lng: center?.lng,
            status: 'empty',
          };
          if (h.mapTargetPickRequest) {
            h.handleSelectCity(city ?? { ...highlight, name: provinceName });
          } else {
            h.handleSelectCity?.(city ?? highlight) ?? h.openMapCityPanel?.(highlight);
          }
          setActiveProvinceLayer(layer, h.activeProvinceLayerRef, getProvinceStyle);
        } catch (err) {
          console.warn('[MAP_CLICK]', err);
        }
      });
    } catch (err) {
      console.warn('[MAP_EACH_PROVINCE]', err);
    }
  }, [findCityForProvince]);

  return { onEachProvince, findCityForProvince, setActiveFeature };
}
