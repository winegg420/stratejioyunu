import { memo, useEffect, useMemo, useState } from 'react';

import { MapContainer, TileLayer } from 'react-leaflet';

import { MAP_GEO } from './mapGeoConfig';
import { IS_WORLD_MAP } from './mapInteractionPolicy';

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
import WorldCountryLabelsLayer from './WorldCountryLabelsLayer';
import MicroCountryHitLayer from './MicroCountryHitLayer';
import MapAttributionStyle from './MapAttributionStyle';

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
import MapSearchFlyBridge from './MapSearchFlyBridge';

import MapRestoreViewport from './MapRestoreViewport';

import MapHexClickPulse from './MapHexClickPulse';

import MapResizeEffect from './MapResizeEffect';
import MapInitialLayout from './MapInitialLayout';
import MapContainerSizer from './MapContainerSizer';
import MapWorldFit from './MapWorldFit';
import MapViewportMinZoom from './MapViewportMinZoom';
import MapBootOverlay from './MapBootOverlay';

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

  onFocusBase,

  loadingMessage = 'Harita yükleniyor…',

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

  searchFlyRequest,

  onSearchFlyDone,

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

  onSurfaceReady,

}) {

  const [tilesReady, setTilesReady] = useState(false);
  const surfaceReady = tilesReady && Boolean(provinces?.features?.length);

  useEffect(() => {
    if (!onSurfaceReady) return undefined;
    if (!surfaceReady) {
      onSurfaceReady(false);
      return undefined;
    }
    const timer = window.setTimeout(() => onSurfaceReady(true), 160);
    return () => window.clearTimeout(timer);
  }, [surfaceReady, onSurfaceReady]);

  const showHud = !isMobile || !hudCollapsed;

  const showCityLabels = IS_WORLD_MAP
    ? mapZoom >= MAP_ZOOM_MARKER_MIN
    : mapZoom >= MAP_ZOOM_LABEL_MIN;

  const showDetailedMarkers = mapZoom >= MAP_ZOOM_MARKER_MIN;

  const showCityDots = ideologyView
    ? IS_WORLD_MAP
      ? mapZoom >= MAP_ZOOM_MARKER_MIN
      : mapZoom >= 4
    : IS_WORLD_MAP
      ? mapZoom >= MAP_ZOOM_MARKER_MIN
      : mapZoom >= 2;

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

      maxZoom={MAP_GEO.maxZoom}

      maxBounds={IS_WORLD_MAP ? undefined : TURKEY_MAX_BOUNDS}

      maxBoundsViscosity={IS_WORLD_MAP ? 0 : 0.05}

      style={{ width: '100%', height: '100%', minHeight: 0 }}

      className={`turkey-map turkey-map--cyber${IS_WORLD_MAP ? ' turkey-map--world' : ''}`}

      scrollWheelZoom

      touchZoom

      dragging={IS_WORLD_MAP}

      doubleClickZoom={false}

      zoomControl={false}

      worldCopyJump={IS_WORLD_MAP}

    >

      <MapMaxBounds />

      <MapContainerSizer />

      <MapViewportMinZoom isFullscreen={isFullscreen} />

      <MapInitialLayout isFullscreen={isFullscreen} ideologyView={ideologyView} />

      <MapWorldFit
        enabled={!restoreViewport && !flyTarget}
        isFullscreen={isFullscreen}
        ideologyView={ideologyView}
        layoutRev={isFullscreen ? `fs-${ideologyView ? 'ideo' : 'std'}` : `std-${ideologyView ? 'ideo' : 'map'}`}
      />

      <MapResizeEffect layoutRev={isFullscreen ? 'fs' : 'normal'} />

      <MapHexClickPulse onMapClick={onMapClickPulse} />

      <MapCityClickRouter

        provinces={provinces}

        mapCities={mapCities}

        playerCities={playerCities}

        ownProvinceNames={ownProvinceNames}

        onSelectCity={onSelectCity}

        enabled={Boolean(onSelectCity)}

      />

      <MapPanZoomController enabled={mapPanEnabled} />

      <MapDragPanController enabled={mapPanEnabled} />

      <MapMouseCoordinateHud visible={showLocHud && !isFullscreen} />

      <TileLayer
        attribution={CARTO_ATTRIBUTION}
        url={CARTO_DARK_MATTER_URL}
        noWrap={IS_WORLD_MAP}
        eventHandlers={{
          load: () => setTilesReady(true),
          loading: () => setTilesReady(false),
        }}
      />

      <MapBootOverlay visible={!surfaceReady} message={loadingMessage} />

      {surfaceReady && (
        <ProvinceRadarLayer
          provinces={provinces}
          botProvinceNames={botProvinceNames}
          ownProvinceNames={ownProvinceNames}
          mapCities={mapCities}
          playerCities={playerCities}
          onEachFeature={onEachProvince}
          layerRef={provinceLayerRef}
          ideologyView={ideologyView}
        />
      )}

      {surfaceReady && ideologyLayer}

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

      <MapAttributionStyle />

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

        visible={!showCityLabels && showCityDots}

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

      <MicroCountryHitLayer
        provinces={provinces}
        mapCities={mapCities}
        playerCities={playerCities}
        ownProvinceNames={ownProvinceNames}
        onSelectCity={onSelectCity}
        zoom={mapZoom}
        viewportBounds={viewportBounds}
        enabled={surfaceReady}
      />

      <WorldCountryLabelsLayer
        provinces={provinces}
        zoom={mapZoom}
        viewportBounds={viewportBounds}
        isFullscreen={isFullscreen}
      />

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

      <MapSearchFlyBridge flyRequest={searchFlyRequest} onDone={onSearchFlyDone} />

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

      <MapFocusCrosshair
        activeCityId={activeCityId}
        playerCities={playerCities}
        mapCities={mapCities}
        onFocusBase={onFocusBase}
        isFullscreen={isFullscreen}
      />

    </MapContainer>

  );

}



export default memo(TurkeyLeafletMap);


