import { memo, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';
import { CARTO_ATTRIBUTION, CARTO_DARK_MATTER_URL } from './cyberMapConfig';
import ProvinceRadarLayer from './ProvinceRadarLayer';
import CityIdeologyProvinceLayer from './CityIdeologyProvinceLayer';
import ProvinceHighlightSync from './ProvinceHighlightSync';
import MapPlayerDataLinks from './MapPlayerDataLinks';
import MapBoundsReporter from './MapBoundsReporter';
import MapAnimatedLayers from './MapAnimatedLayers';
import CityTargetReticleLayer from './CityTargetReticleLayer';
import CityMapLabelsLayer from './CityMapLabelsLayer';
import CityDotLayer from './CityDotLayer';
import CityMarkers from './CityMarkers';
import { MAP_ZOOM_LABEL_MIN } from './mapZoomConfig';
import ActiveCityMapFocus from './ActiveCityMapFocus';
import MapHudConnector from './MapHudConnector';
import MapFocusCrosshair from './MapFocusCrosshair';
import MapMaxBounds from './MapMaxBounds';
import MapHudControls from './MapHudControls';
import MapPanZoomController from './MapPanZoomController';
import MapDragPanController from './MapDragPanController';
import MapMouseCoordinateHud from './MapMouseCoordinateHud';
import CityDiplomacyBadgeLayer from './CityDiplomacyBadgeLayer';
import MapFitFlyLayers from './MapFitFlyLayers';
import MapHexClickPulse from './MapHexClickPulse';
import MapResizeEffect from './MapResizeEffect';

const TURKEY_CENTER = [39.0, 35.0];
const TURKEY_ZOOM = 6;

function HudBridge() {
  return <MapHudControls />;
}

function TurkeyLeafletMap({
  provinces,
  botProvinceNames,
  onEachProvince,
  ideologyView,
  filteredCities,
  mapCities,
  playerCities,
  playerIdeology,
  activeHighlightCity,
  provinceLayerRef,
  expeditions,
  activeCityId,
  underAttack,
  incomingAttacks,
  onSelectCity,
  onCityHover,
  onCityHoverEnd,
  mapZoom,
  activeLat,
  activeLng,
  fitBounds,
  flyTarget,
  isMobile,
  mapPanEnabled = true,
  hudCollapsed,
  onViewportChange,
  onMapClickPulse,
}) {
  const showHud = !isMobile || !hudCollapsed;
  const showCityLabels = mapZoom >= MAP_ZOOM_LABEL_MIN;

  const ideologyLayer = useMemo(() => {
    if (!ideologyView) return null;
    return (
      <CityIdeologyProvinceLayer
        provinces={provinces}
        mapCities={filteredCities}
        playerCities={playerCities}
        playerIdeology={playerIdeology}
        enabled
      />
    );
  }, [ideologyView, provinces, filteredCities, playerCities, playerIdeology]);

  return (
    <MapContainer
      center={TURKEY_CENTER}
      zoom={TURKEY_ZOOM}
      minZoom={5}
      maxBounds={TURKEY_MAX_BOUNDS}
      className="turkey-map turkey-map--cyber"
      scrollWheelZoom
      touchZoom
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
    >
      <MapMaxBounds />
      <MapResizeEffect />
      <MapHexClickPulse onMapClick={onMapClickPulse} />
      <MapPanZoomController enabled={mapPanEnabled} />
      <MapDragPanController enabled={mapPanEnabled} />
      <MapMouseCoordinateHud />
      <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_DARK_MATTER_URL} />
      <ProvinceRadarLayer
        provinces={provinces}
        botProvinceNames={botProvinceNames}
        onEachFeature={onEachProvince}
      />
      {ideologyLayer}
      <ProvinceHighlightSync
        activeCity={activeHighlightCity}
        provinces={provinces}
        playerCities={playerCities}
        layerRef={provinceLayerRef}
      />
      <MapPlayerDataLinks playerCities={playerCities} />
      <MapBoundsReporter onViewportChange={onViewportChange} />
      <MapAnimatedLayers
        expeditions={expeditions}
        mapCities={mapCities}
        playerCities={playerCities}
      />
      <CityDotLayer
        mapCities={filteredCities}
        playerCities={playerCities}
        visible={!showCityLabels}
        renderKey={Math.round((mapZoom ?? 6) * 10)}
      />
      <CityDiplomacyBadgeLayer mapCities={filteredCities} visible={showCityLabels} />
      <CityTargetReticleLayer
        mapCities={filteredCities}
        playerCities={playerCities}
        zoom={mapZoom}
      />
      <CityMapLabelsLayer
        mapCities={filteredCities}
        playerCities={playerCities}
        zoom={mapZoom}
      />
      <CityMarkers
        mapCities={filteredCities}
        playerCities={playerCities}
        activeCityId={activeCityId}
        underAttack={underAttack}
        incomingAttacks={incomingAttacks}
        onSelectCity={onSelectCity}
        onCityHover={onCityHover}
        onCityHoverEnd={onCityHoverEnd}
        showPinLabels={showCityLabels}
        markerRenderKey={Math.round((mapZoom ?? 6) * 10)}
      />
      <ActiveCityMapFocus lat={activeLat} lng={activeLng} activeCityId={activeCityId} />
      <MapFitFlyLayers fitBounds={fitBounds} flyTarget={flyTarget} />
      {showHud && <HudBridge />}
      {activeLat != null && activeLng != null && (
        <MapHudConnector lat={activeLat} lng={activeLng} />
      )}
      <MapFocusCrosshair lat={activeLat} lng={activeLng} />
    </MapContainer>
  );
}

export default memo(TurkeyLeafletMap);
