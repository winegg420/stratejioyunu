import { useCallback, useRef } from 'react';
import L from 'leaflet';
import { enrichMapCityWithProvince } from './cityProvinceMatch';
import { findCityForProvinceFeature, buildMapTargetFromProvince } from './mapProvincePick';
import { getHoverStyle } from './mapUtils';
import { resolveProvinceLayerStyle } from '../lib/botProvincePulse';
import { setActiveProvinceLayer } from './ProvinceHighlightSync';
import { getCountryDisplayLabel } from '../lib/countryDisplayNames';

/**
 * İl poligonu hover/tıklama — stabil onEachFeature (GeoJSON yeniden bağlanmaz).
 */
export function useProvinceMapHandlers({
  mapCities,
  playerCities,
  mapTargetPickRequest,
  expeditionLaunchMode,
  fulfillMapTargetPick,
  navigate,
  handleSelectCity,
  openMapCityPanel,
  onProvinceView,
  setActiveHighlightCity,
  activeProvinceLayerRef,
  botProvinceNamesRef,
  ownProvinceNamesRef,
  provinceStyleContextRef,
}) {
  const handlersRef = useRef({});

  handlersRef.current = {
    mapCities,
    playerCities,
    mapTargetPickRequest,
    expeditionLaunchMode,
    fulfillMapTargetPick,
    navigate,
    handleSelectCity,
    openMapCityPanel,
    onProvinceView,
    setActiveHighlightCity,
    activeProvinceLayerRef,
    botProvinceNamesRef,
    ownProvinceNamesRef,
    provinceStyleContextRef,
  };

  const resolveLayerStyle = useCallback((layer) => {
    const h = handlersRef.current;
    const name = layer?.feature?.properties?.shapeName;
    return resolveProvinceLayerStyle(
      name,
      h.ownProvinceNamesRef?.current,
      h.botProvinceNamesRef?.current,
      h.provinceStyleContextRef?.current,
    );
  }, []);

  const findCityForProvince = useCallback((feature) => {
    try {
      const { mapCities: cities, playerCities: pcs } = handlersRef.current;
      return findCityForProvinceFeature(feature, cities, pcs);
    } catch (err) {
      console.warn('[MAP_PROVINCE]', err);
      return null;
    }
  }, []);

  const setActiveFeature = useCallback((layer) => {
    setActiveProvinceLayer(
      layer,
      handlersRef.current.activeProvinceLayerRef,
      resolveLayerStyle,
    );
  }, [resolveLayerStyle]);

  const onEachProvince = useCallback((feature, layer) => {
    try {
      if (!feature || !layer) return;
      const name = feature.properties?.shapeName;
      if (name) {
        const tooltipLabel = () => getCountryDisplayLabel(name);
        layer.bindTooltip(tooltipLabel, {
          sticky: false,
          direction: 'top',
          offset: [0, -10],
          opacity: 0.96,
          className: 'map-tooltip map-tooltip--cyber',
        });
      }

      const applyBaseStyle = () => {
        try {
          layer.setStyle(resolveLayerStyle(layer));
        } catch {
          /* layer disposed */
        }
      };

      layer.on('mouseover', (e) => {
        try {
          if (name) {
            layer.setTooltipContent?.(getCountryDisplayLabel(name));
            const tip = layer.getTooltip?.();
            if (tip) {
              const anchor = e?.latlng ?? layer.getBounds?.()?.getCenter?.();
              if (anchor) layer.openTooltip(anchor);
              else layer.openTooltip();
            }
          }
          if (handlersRef.current.activeProvinceLayerRef.current !== layer) {
            layer.setStyle(getHoverStyle(resolveLayerStyle(layer)));
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
          const map = layer?._map;
          if (map?._suppressMapClickUntil && Date.now() < map._suppressMapClickUntil) return;
          L.DomEvent.stopPropagation(e);
          e?.originalEvent?.stopPropagation?.();
          layer.closeTooltip?.();
          const h = handlersRef.current;
          const center = layer.getBounds?.()?.getCenter?.();
          const clickLatLng = e?.latlng ?? center;
          const target = buildMapTargetFromProvince(
            feature,
            clickLatLng,
            h.mapCities,
            h.playerCities,
            h.ownProvinceNamesRef?.current,
          );
          const enriched = enrichMapCityWithProvince(target, h.playerCities);
          h.setActiveHighlightCity?.(enriched);
          if (h.mapTargetPickRequest || h.expeditionLaunchMode) {
            h.handleSelectCity(enriched);
          } else if (enriched.status === 'empty' && h.onProvinceView) {
            h.onProvinceView(enriched);
          } else {
            h.openMapCityPanel(enriched);
          }
          setActiveProvinceLayer(layer, h.activeProvinceLayerRef, resolveLayerStyle);
        } catch (err) {
          console.warn('[MAP_CLICK]', err);
        }
      });
    } catch (err) {
      console.warn('[MAP_EACH_PROVINCE]', err);
    }
  }, [findCityForProvince, resolveLayerStyle]);

  return { onEachProvince, findCityForProvince, setActiveFeature };
}

