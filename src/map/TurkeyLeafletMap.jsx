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
import MapRestoreViewport from './MapRestoreViewport';
import MapHexClickPulse from './MapHexClickPulse';
import MapResizeEffect from './MapResizeEffect';
import MapCityClickRouter from './MapCityClickRouter';

const TURKEY_CENTER = [39.0, 35.0];
const TURKEY_ZOOM = 6;

function HudBridge() {
  return <MapHudControls />;
}

function TurkeyLeafletMap({
  provinces,
  botProvinceNames,
  ownProvinceNames,
  onEachProvince,
  ideologyView,
  filteredCities,
  mapCities,
  playerCities,
  playerIdeology,
  onFlyComplete,
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
  restoreViewport,
  isMobile,
  mapPanEnabled = true,
  hudCollapsed,
  onViewportChange,
  onMapClickPulse,
  isFullscreen = false,
  showLocHud = true,
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
      minZoom={4}
      maxBounds={TURKEY_MAX_BOUNDS}
      maxBoundsViscosity={0.05}
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
      <MapCityClickRouter
        provinces={provinces}
        mapCities={mapCities}
        playerCities={playerCities}
        onSelectCity={onSelectCity}
        enabled={Boolean(onSelectCity)}
      />
      <MapPanZoomController enabled={mapPanEnabled} />
      <MapDragPanController enabled={mapPanEnabled} />
      <MapMouseCoordinateHud visible={showLocHud && !isFullscreen} />
      <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_DARK_MATTER_URL} />
      <ProvinceRadarLayer
        provinces={provinces}
        botProvinceNames={botProvinceNames}
        ownProvinceNames={ownProvinceNames}
        onEachFeature={onEachProvince}
        layerRef={provinceLayerRef}
      />
      {ideologyLayer}
      <ProvinceHighlightSync
        activeCity={activeHighlightCity}
        provinces={provinces}
        playerCities={playerCities}
        layerRef={provinceLayerRef}
        ownProvinceNames={ownProvinceNames}
        botProvinceNames={botProvinceNames}
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
        playerIdeology={playerIdeology}
        ideologyView={ideologyView}
        visible={!showCityLabels}
        renderKey={Math.round((mapZoom ?? 6) * 10)}
      />
      <CityDiplomacyBadgeLayer mapCities={filteredCities} visible={showCityLabels} />
      <CityTargetReticleLayer
        mapCities={mapCities}
        playerCities={playerCities}
        playerIdeology={playerIdeology}
        ideologyView={ideologyView}
        zoom={mapZoom}
        onSelectCity={onSelectCity}
      />
      <CityMarkers
        mapCities={mapCities}
        playerCities={playerCities}
        playerIdeology={playerIdeology}
        ideologyView={ideologyView}
        activeCityId={activeCityId}
        underAttack={underAttack}
        incomingAttacks={incomingAttacks}
        onSelectCity={onSelectCity}
        onCityHover={onCityHover}
        onCityHoverEnd={onCityHoverEnd}
        showPinLabels={showCityLabels}
        markerRenderKey={Math.round((mapZoom ?? 6) * 10)}
      />
      <CityMapLabelsLayer
        mapCities={mapCities}
        playerCities={playerCities}
        provinces={provinces}
        zoom={mapZoom}
        onSelectCity={onSelectCity}
      />
      <ActiveCityMapFocus lat={activeLat} lng={activeLng} activeCityId={activeCityId} />
      <MapFitFlyLayers
        fitBounds={fitBounds}
        flyTarget={flyTarget}
        onFlyComplete={onFlyComplete}
      />
      {restoreViewport && <MapRestoreViewport snapshot={restoreViewport} />}
      {showHud && <HudBridge />}
      {activeLat != null && activeLng != null && (
        <MapHudConnector lat={activeLat} lng={activeLng} />
      )}
      <MapFocusCrosshair lat={activeLat} lng={activeLng} />
    </MapContainer>
  );
}

export default memo(TurkeyLeafletMap);
