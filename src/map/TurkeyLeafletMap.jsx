import { memo, useMemo } from 'react';

import { MapContainer, TileLayer } from 'react-leaflet';

import { MAP_GEO } from './mapGeoConfig';

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

import { MAP_ZOOM_LABEL_MIN, MAP_ZOOM_MARKER_MIN } from './mapZoomConfig';

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



const MAP_CENTER = MAP_GEO.center;

const MAP_DEFAULT_ZOOM = MAP_GEO.zoom;



function HudBridge({ onWorldView }) {
  return <MapHudControls onWorldView={onWorldView} />;
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

  onFlySettled,

  onWorldView,

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

  suppressActiveCityFocus = false,

  viewportBounds = null,

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

  const showDetailedMarkers = mapZoom >= MAP_ZOOM_MARKER_MIN;



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

      center={MAP_CENTER}

      zoom={MAP_DEFAULT_ZOOM}

      minZoom={MAP_GEO.minZoom}

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

        zoom={mapZoom}

        viewportBounds={viewportBounds}

        renderKey={Math.round((mapZoom ?? 6) * 10)}

      />

      {showDetailedMarkers && (

        <CityTargetReticleLayer

          mapCities={mapCities}

          playerCities={playerCities}

          playerIdeology={playerIdeology}

          ideologyView={ideologyView}

          zoom={mapZoom}

          viewportBounds={viewportBounds}

          onSelectCity={onSelectCity}

        />

      )}

      {showDetailedMarkers && (

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

          zoom={mapZoom}

          viewportBounds={viewportBounds}

          markerRenderKey={Math.round((mapZoom ?? 6) * 10)}

        />

      )}

      <CityMapLabelsLayer

        mapCities={mapCities}

        playerCities={playerCities}

        zoom={mapZoom}

        viewportBounds={viewportBounds}

        onSelectCity={onSelectCity}

      />

      <CityDiplomacyBadgeLayer mapCities={filteredCities} visible={showDetailedMarkers} />

      <MapFitFlyLayers

        fitBounds={fitBounds}

        flyTarget={flyTarget}

        onFlyComplete={onFlyComplete}

        onFlySettled={onFlySettled}

      />

      <ActiveCityMapFocus

        lat={activeLat}

        lng={activeLng}

        activeCityId={activeCityId}

        disabled={suppressActiveCityFocus || Boolean(flyTarget || restoreViewport)}

      />

      {restoreViewport && <MapRestoreViewport snapshot={restoreViewport} />}

      {showHud && <HudBridge onWorldView={onWorldView} />}

      {activeLat != null && activeLng != null && (

        <MapHudConnector lat={activeLat} lng={activeLng} />

      )}

      <MapFocusCrosshair lat={activeLat} lng={activeLng} />

    </MapContainer>

  );

}



export default memo(TurkeyLeafletMap);


