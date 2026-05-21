import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-tactical.css';
import CityDetailPanel from './CityDetailPanel';
import CityMarkers from './CityMarkers';
import MapAnimatedLayers from './MapAnimatedLayers';
import MapHudControls from './MapHudControls';
import MapHudConnector from './MapHudConnector';
import MapPlayerDataLinks from './MapPlayerDataLinks';
import MapFocusCrosshair from './MapFocusCrosshair';
import ActiveCityMapFocus from './ActiveCityMapFocus';
import MapBoundsReporter from './MapBoundsReporter';
import MapMaxBounds from './MapMaxBounds';
import MapMiniMap from './MapMiniMap';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';
import { CARTO_ATTRIBUTION, CARTO_DARK_MATTER_URL } from './cyberMapConfig';
import { getProvinceStyle, getHoverStyle } from './mapUtils';
import CityIdeologyProvinceLayer from './CityIdeologyProvinceLayer';
import CityMapLabelsLayer from './CityMapLabelsLayer';
import CityTargetReticleLayer from './CityTargetReticleLayer';
import ProvinceHighlightSync, { setActiveProvinceLayer } from './ProvinceHighlightSync';
import { enrichMapCityWithProvince, resolveCityProvinceName } from './cityProvinceMatch';
import NeighborCountriesLayer from './NeighborCountriesLayer';
import TacticalSearchConsole from './TacticalSearchConsole';
import { normalizeMapCities } from './botCityUtils';
import { IDEOLOGY_PROFILES } from '../lib/ideologySystem';
import { useGameStore, useUnderAttack } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';

const TURKEY_CENTER = [39.0, 35.0];
const TURKEY_ZOOM = 6;

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, bounds]);
  return null;
}

function FlyToCity({ lat, lng, zoom = 9 }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5, easeLinearity: 0.25 });
    }
  }, [map, lat, lng, zoom]);
  return null;
}

function MapInteractionController({ interactionLocked }) {
  const map = useMap();

  useEffect(() => {
    if (interactionLocked) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.disable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    }
  }, [map, interactionLocked]);

  return null;
}

function HudBridge() {
  return <MapHudControls />;
}

function MapCoordTooltip({ hover }) {
  if (!hover) return null;
  return (
    <div
      className="map-coord-tooltip"
      style={{ left: hover.x, top: hover.y }}
      role="tooltip"
    >
      {hover.name && <span className="map-coord-tooltip__city">{hover.name}</span>}
      <span>
        COORD_X: {hover.lat.toFixed(2)} | Y: {hover.lng.toFixed(2)}
      </span>
    </div>
  );
}

export default function TurkeyMap() {
  const navigate = useNavigate();
  const [mapReady, setMapReady] = useState(false);
  const mapCitiesRaw = useGameStore((s) => s.mapCities);
  const mapCities = useMemo(() => normalizeMapCities(mapCitiesRaw), [mapCitiesRaw]);
  const expeditions = useGameStore((s) => s.expeditions);
  const mapFocusRequest = useGameStore((s) => s.mapFocusRequest);
  const clearMapFocusRequest = useGameStore((s) => s.clearMapFocusRequest);
  const mapTargetPickRequest = useGameStore((s) => s.mapTargetPickRequest);
  const fulfillMapTargetPick = useGameStore((s) => s.fulfillMapTargetPick);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);
  const underAttack = useUnderAttack();
  const isMobile = useIsMobile();
  const [mapLocked, setMapLocked] = useState(true);
  const [provinces, setProvinces] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [search, setSearch] = useState('');
  const [searchCoord, setSearchCoord] = useState('');
  const [fitBounds, setFitBounds] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityPick, setCityPick] = useState('');
  const [viewport, setViewport] = useState(null);
  const [hoverCoord, setHoverCoord] = useState(null);
  const setViewportStable = useCallback((next) => {
    setViewport((prev) => {
      if (!prev || !next) return next;
      const pb = prev.bounds;
      const nb = next.bounds;
      const pc = prev.center;
      const nc = next.center;
      if (
        prev.zoom === next.zoom
        && pc.lat === nc.lat
        && pc.lng === nc.lng
        && pb.getNorth() === nb.getNorth()
        && pb.getSouth() === nb.getSouth()
        && pb.getEast() === nb.getEast()
        && pb.getWest() === nb.getWest()
      ) {
        return prev;
      }
      return next;
    });
  }, []);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const [ideologyView, setIdeologyView] = useState(false);
  const [activeHighlightCity, setActiveHighlightCity] = useState(null);
  const provinceLayerRef = useRef(null);
  const activeProvinceLayerRef = useRef(null);
  const playerIdeology = useGameStore((s) => s.playerIdeology);

  const interactionLocked = isMobile ? mapLocked : true;

  const activePlayerCity = useMemo(
    () => playerCities.find((c) => c.id === activeCityId) ?? playerCities[0],
    [playerCities, activeCityId],
  );

  const activeLat = activePlayerCity?.lat;
  const activeLng = activePlayerCity?.lng;

  const activeMapCity = useMemo(() => {
    if (!activePlayerCity) return null;
    return (
      mapCities.find((c) => c.name === activePlayerCity.name)
      ?? {
        name: activePlayerCity.name,
        lat: activePlayerCity.lat,
        lng: activePlayerCity.lng,
        status: 'own',
      }
    );
  }, [activePlayerCity, mapCities]);

  useEffect(() => {
    setMapReady(true);
    return () => setMapReady(false);
  }, []);

  useEffect(() => {
    fetch('/geo/provinces.json')
      .then((r) => r.json())
      .then(setProvinces)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapFocusRequest) return;
    const originPc = playerCities.find((p) => p.id === mapFocusRequest.originCityId);
    const home = mapCities.find((c) => c.name === originPc?.name);
    const target = mapCities.find((c) => c.name === mapFocusRequest.targetName);
    if (home && target) {
      const bounds = L.latLngBounds(
        [home.lat, home.lng],
        [target.lat, target.lng],
      );
      setFitBounds(bounds);
      setFlyTarget(null);
    }
    clearMapFocusRequest();
  }, [mapFocusRequest, playerCities, mapCities, clearMapFocusRequest]);

  const provinceStyle = useCallback(() => getProvinceStyle(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    setScanPulse(true);
    window.setTimeout(() => setScanPulse(false), 480);
    const q = search.trim().toLowerCase();
    const coord = searchCoord.trim();
    if (coord) {
      const [lat, lng] = coord.split(',').map((n) => parseFloat(n.trim()));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setFitBounds(L.latLngBounds([[lat, lng]]));
        const near = mapCities.find(
          (c) => Math.abs(c.lat - lat) < 1 && Math.abs(c.lng - lng) < 1,
        );
        setSelectedCity(near || { name: 'Koordinat', status: 'empty', lat, lng });
        return;
      }
    }
    const city = mapCities.find((c) => c.name.toLowerCase().includes(q));
    if (city) {
      setSelectedCity(city);
      setActiveHighlightCity(city);
      setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
    }
  };

  const filteredCities = search
    ? mapCities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : mapCities;

  const hasMapFilter = Boolean(
    search.trim()
    || searchCoord.trim()
    || cityPick
    || selectedCity
    || activeHighlightCity,
  );

  const clearMapFilters = useCallback(() => {
    setSearch('');
    setSearchCoord('');
    setCityPick('');
    setSelectedCity(null);
    setActiveHighlightCity(null);
    setFlyTarget(null);
    setFitBounds(TURKEY_MAX_BOUNDS);
    if (activeProvinceLayerRef.current) {
      activeProvinceLayerRef.current.setStyle(getProvinceStyle());
      activeProvinceLayerRef.current = null;
    }
  }, []);

  const handleCityHover = useCallback((payload) => setHoverCoord(payload), []);
  const handleCityHoverEnd = useCallback(() => setHoverCoord(null), []);

  const handleSelectCity = useCallback((city) => {
    const enriched = enrichMapCityWithProvince(city, playerCities);
    if (mapTargetPickRequest) {
      const own = new Set(playerCities.map((c) => c.name));
      if (own.has(enriched.name)) return;
      fulfillMapTargetPick(enriched.name);
      navigate(mapTargetPickRequest.returnPath ?? '/istihbarat');
      return;
    }
    setSelectedCity(enriched);
    setActiveHighlightCity(enriched);
  }, [mapTargetPickRequest, playerCities, fulfillMapTargetPick, navigate]);

  const findCityForProvince = useCallback((feature) => {
    const provinceName = feature.properties?.shapeName;
    if (!provinceName) return null;
    return mapCities.find(
      (c) => resolveCityProvinceName(c, playerCities) === provinceName,
    ) ?? mapCities.find((c) => c.name === provinceName) ?? null;
  }, [mapCities, playerCities]);

  const setActiveFeature = useCallback((layer) => {
    setActiveProvinceLayer(layer, activeProvinceLayerRef, getProvinceStyle);
  }, []);

  const onEachProvince = useCallback((feature, layer) => {
    const name = feature.properties?.shapeName;
    if (name) {
      layer.bindTooltip(name, { sticky: true, className: 'map-tooltip map-tooltip--cyber' });
    }
    layer.on('mouseover', () => {
      if (activeProvinceLayerRef.current !== layer) {
        layer.setStyle(getHoverStyle(getProvinceStyle()));
      }
    });
    layer.on('mouseout', () => {
      if (activeProvinceLayerRef.current !== layer) {
        layer.setStyle(getProvinceStyle());
      }
    });
    layer.on('click', () => {
      const city = findCityForProvince(feature);
      if (city) {
        handleSelectCity(city);
      } else {
        setActiveHighlightCity({
          name: feature.properties?.shapeName ?? 'Bölge',
          provinceName: feature.properties?.shapeName,
          province: feature.properties?.shapeISO,
        });
      }
      setActiveFeature(layer);
    });
  }, [findCityForProvince, handleSelectCity, setActiveFeature]);

  const mapZoom = viewport?.zoom ?? TURKEY_ZOOM;

  return (
    <div
      className={[
        'map-page',
        'map-page--cyber',
        'map-page--tactical',
        mapLocked && isMobile ? 'map-interaction-locked' : 'map-interaction-unlocked',
        mapTargetPickRequest && 'map-page--pick-target',
      ].filter(Boolean).join(' ')}
    >
      {isMobile && (
        <div className="map-mobile-controls map-mobile-controls--cyber">
          <button
            type="button"
            className={`btn map-lock-btn ${mapLocked ? 'active' : ''}`}
            onClick={() => setMapLocked((v) => !v)}
            aria-pressed={mapLocked}
          >
            {mapLocked ? '🔒 Harita Kilidi (Açık)' : '🔓 Sayfa Kaydırma'}
          </button>
          {!mapLocked && (
            <select
              className="map-city-select map-city-select--mobile"
              value={cityPick}
              onChange={(e) => {
                const name = e.target.value;
                setCityPick(name);
                const city = mapCities.find((c) => c.name === name);
                if (city) {
                  setFlyTarget({ lat: city.lat, lng: city.lng });
                  handleSelectCity(city);
                  if (!mapTargetPickRequest) {
                    setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
                  }
                }
              }}
            >
              <option value="">Şehir ara...</option>
              {mapCities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} — {c.status === 'bot' ? 'BOT' : (c.owner || 'Boş')}
                </option>
              ))}
            </select>
          )}
          <span className="map-lock-hint">
            {mapLocked
              ? 'İki parmakla yakınlaştırın · haritayı sürükleyin'
              : 'Şehir seçin veya aşağı kaydırın'}
          </span>
        </div>
      )}

      <MapCoordTooltip hover={hoverCoord} />

      {mapTargetPickRequest && (
        <div className="map-pick-target-banner" role="status">
          [ HEDEF SEÇ ] — Haritada bir düşman üssüne tıklayın
        </div>
      )}

      <div className="map-ideology-toolbar" role="toolbar" aria-label="Harita ideoloji filtreleri">
        <button
          type="button"
          className={`btn btn-secondary btn-sm map-ideology-toggle${ideologyView ? ' active' : ''}`}
          onClick={() => setIdeologyView((v) => !v)}
          aria-pressed={ideologyView}
        >
          [ SİYASİ İDEOLOJİ GÖRÜNÜMÜ ]
        </button>
        {ideologyView && (
          <div className="map-ideology-legend" aria-hidden="true">
            {Object.values(IDEOLOGY_PROFILES).map((p) => (
              <span key={p.id} className="map-ideology-legend__item" style={{ color: p.color }}>
                {p.emoji} {p.subtitle}
              </span>
            ))}
            <span className="map-ideology-legend__ally">◈ Aynı ideoloji = Doğal Müttefik</span>
          </div>
        )}
      </div>

      <div className="map-container map-container-wrap map-container-wrap--cyber map-container--tactical">
        {(!isMobile || !mapLocked) && (
          <TacticalSearchConsole
            mapCities={mapCities}
            cityPick={cityPick}
            setCityPick={setCityPick}
            onCitySelect={(city) => {
              setCityPick(city.name);
              setFlyTarget({ lat: city.lat, lng: city.lng });
              handleSelectCity(city);
              if (!mapTargetPickRequest) {
                setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
              }
            }}
            search={search}
            setSearch={setSearch}
            searchCoord={searchCoord}
            setSearchCoord={setSearchCoord}
            handleSearch={handleSearch}
            scanPulse={scanPulse}
            onResetFilter={clearMapFilters}
            hasActiveFilter={hasMapFilter}
          />
        )}
        <div className="map-tactical-overlay" aria-hidden="true">
          <div className="map-tactical-grid" />
          <div className="map-tactical-scanlines" />
          <div className="map-tactical-radar-sweep" />
        </div>

        {!mapReady && (
          <div className="map-loading-placeholder" aria-live="polite">
            Harita yükleniyor…
          </div>
        )}
        {mapReady && (
        <MapContainer
          key="turkey-main-map"
          center={TURKEY_CENTER}
          zoom={TURKEY_ZOOM}
          minZoom={5}
          maxBounds={TURKEY_MAX_BOUNDS}
          className="turkey-map turkey-map--cyber"
          scrollWheelZoom={!isMobile}
          touchZoom
          dragging
          doubleClickZoom
          zoomControl={false}
        >
          <MapMaxBounds />
          {isMobile && <MapInteractionController interactionLocked={interactionLocked} />}
          <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_DARK_MATTER_URL} />
          <NeighborCountriesLayer />
          {provinces && (
            <GeoJSON
              key="provinces-radar"
              ref={provinceLayerRef}
              data={provinces}
              className="map-province-layer"
              style={provinceStyle}
              smoothFactor={1.5}
              onEachFeature={onEachProvince}
            />
          )}
          <CityIdeologyProvinceLayer
            provinces={provinces}
            mapCities={filteredCities}
            playerCities={playerCities}
            playerIdeology={playerIdeology}
            enabled={ideologyView}
          />
          <ProvinceHighlightSync
            activeCity={activeHighlightCity}
            provinces={provinces}
            playerCities={playerCities}
            layerRef={provinceLayerRef}
          />
          <MapPlayerDataLinks playerCities={playerCities} />
          <MapBoundsReporter onViewportChange={setViewportStable} />
          <MapAnimatedLayers
            expeditions={expeditions}
            mapCities={mapCities}
            playerCities={playerCities}
          />
          <CityTargetReticleLayer
            mapCities={filteredCities}
            playerCities={playerCities}
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
            onSelectCity={handleSelectCity}
            onCityHover={handleCityHover}
            onCityHoverEnd={handleCityHoverEnd}
            showPinLabels={mapZoom < 6}
          />
          <ActiveCityMapFocus lat={activeLat} lng={activeLng} activeCityId={activeCityId} />
          {fitBounds && <FitBounds bounds={fitBounds} />}
          {flyTarget && (
            <FlyToCity lat={flyTarget.lat} lng={flyTarget.lng} zoom={9} />
          )}
          {(!isMobile || !hudCollapsed) && <HudBridge />}
          {activeLat != null && activeLng != null && (
            <MapHudConnector lat={activeLat} lng={activeLng} />
          )}
          <MapFocusCrosshair lat={activeLat} lng={activeLng} />
        </MapContainer>
        )}
        {isMobile && (
          <button
            type="button"
            className="map-collapse-toggle map-collapse-toggle--hud"
            onClick={() => setHudCollapsed((v) => !v)}
            aria-expanded={!hudCollapsed}
          >
            {hudCollapsed ? 'HUD Aç' : 'HUD Kapat'}
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            className="map-collapse-toggle map-collapse-toggle--minimap"
            onClick={() => setMiniMapCollapsed((v) => !v)}
            aria-expanded={!miniMapCollapsed}
          >
            {miniMapCollapsed ? 'Mini Harita' : 'Mini Harita Kapat'}
          </button>
        )}
        <div className={`map-minimap-wrap${miniMapCollapsed && isMobile ? ' map-minimap-wrap--collapsed' : ''}`}>
          <MapMiniMap viewport={viewport} activeCity={activeMapCity} mapCities={mapCities} />
        </div>
        {selectedCity && (
          <CityDetailPanel
            city={selectedCity}
            onClose={() => {
              setSelectedCity(null);
              setActiveHighlightCity(null);
              if (activeProvinceLayerRef.current) {
                activeProvinceLayerRef.current.setStyle(getProvinceStyle());
                activeProvinceLayerRef.current = null;
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
