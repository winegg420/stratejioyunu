import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-tactical.css';
import CityDetailPanel from './CityDetailPanel';
import MapMiniMap from './MapMiniMap';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';
import { getProvinceStyle } from './mapUtils';
import TacticalSearchConsole from './TacticalSearchConsole';
import MapTacticalCommandBar from './MapTacticalCommandBar';
import MapIntelSidebar from './MapIntelSidebar';
import MapStatusBand from './MapStatusBand';
import TurkeyLeafletMap from './TurkeyLeafletMap';
import { normalizeMapCities } from './botCityUtils';
import { enrichMapCityWithProvince } from './cityProvinceMatch';
import { buildBotProvinceNameSet } from '../lib/botProvincePulse';
import { useMapFullscreen } from '../hooks/useMapFullscreen';
import { useProvinceMapHandlers } from './useProvinceMapHandlers';
import { useGameStore, useUnderAttack } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { getMapCityDisplayName } from './mapCityDisplayName';
import { releaseMapSessionLocks } from './mapRouteCleanup';

function MapCoordTooltip({ hover }) {
  if (!hover) return null;
  return (
    <div
      className="map-coord-tooltip"
      style={{ left: hover.x, top: hover.y }}
      role="tooltip"
    >
      {hover.name && (
        <span className="map-coord-tooltip__city">{getMapCityDisplayName(hover.name)}</span>
      )}
      <span>
        COORD_X: {hover.lat.toFixed(2)} | Y: {hover.lng.toFixed(2)}
      </span>
    </div>
  );
}

export default function TurkeyMap() {
  const navigate = useNavigate();
  const { theaterRef, isFullscreen, exitFullscreen, toggleFullscreen } = useMapFullscreen();

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
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const isMobile = useIsMobile();

  const [mapReady, setMapReady] = useState(false);
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
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const [ideologyView, setIdeologyView] = useState(false);
  const [activeHighlightCity, setActiveHighlightCity] = useState(null);
  const [hexPulses, setHexPulses] = useState([]);

  const provinceLayerRef = useRef(null);
  const activeProvinceLayerRef = useRef(null);
  const botPulsePhaseRef = useRef(0);
  const hexPulseTimersRef = useRef([]);

  const handleMapClickPulse = useCallback((pulse) => {
    setHexPulses((prev) => [...prev, pulse].slice(-12));
    const timer = window.setTimeout(() => {
      setHexPulses((prev) => prev.filter((p) => p.id !== pulse.id));
    }, 520);
    hexPulseTimersRef.current.push(timer);
  }, []);

  useEffect(() => () => {
    hexPulseTimersRef.current.forEach((t) => window.clearTimeout(t));
    hexPulseTimersRef.current = [];
  }, []);
  const botProvinceNamesRef = useRef(new Set());

  const interactionLocked = isMobile ? mapLocked : true;

  const ensureMapBotProvinces = useGameStore((s) => s.ensureMapBotProvinces);

  useEffect(() => () => releaseMapSessionLocks(), []);

  const botProvinceNames = useMemo(
    () => buildBotProvinceNameSet(mapCities, playerCities, provinces),
    [mapCities, playerCities, provinces],
  );
  botProvinceNamesRef.current = botProvinceNames;

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

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mapCities;
    return mapCities.filter((c) => c.name.toLowerCase().includes(q));
  }, [mapCities, search]);

  const hasMapFilter = useMemo(
    () => Boolean(
      search.trim()
      || searchCoord.trim()
      || cityPick
      || selectedCity
      || activeHighlightCity,
    ),
    [search, searchCoord, cityPick, selectedCity, activeHighlightCity],
  );

  const mapZoom = viewport?.zoom ?? 6;

  const mapLiveStats = useMemo(() => ({
    botCities: mapCities.filter((c) => c.status === 'bot').length,
    playerCities: playerCities.length,
    activeExpeditions: (expeditions ?? []).filter((e) => e.direction === 'outgoing').length,
  }), [mapCities, playerCities, expeditions]);

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

  const { onEachProvince } = useProvinceMapHandlers({
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
  });

  const handleCityHover = useCallback((payload) => setHoverCoord(payload), []);
  const handleCityHoverEnd = useCallback(() => setHoverCoord(null), []);

  const handleSearch = useCallback((e) => {
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
  }, [search, searchCoord, mapCities]);

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

  const handleCloseCityPanel = useCallback(() => {
    setSelectedCity(null);
    setActiveHighlightCity(null);
    if (activeProvinceLayerRef.current) {
      activeProvinceLayerRef.current.setStyle(getProvinceStyle());
      activeProvinceLayerRef.current = null;
    }
  }, []);

  const handleToggleIdeology = useCallback(() => {
    setIdeologyView((v) => !v);
  }, []);

  const handleConsoleCitySelect = useCallback((city) => {
    setCityPick(city.name);
    setFlyTarget({ lat: city.lat, lng: city.lng });
    handleSelectCity(city);
    if (!mapTargetPickRequest) {
      setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
    }
  }, [handleSelectCity, mapTargetPickRequest]);

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
    if (!provinces) return;
    ensureMapBotProvinces(provinces);
  }, [provinces, ensureMapBotProvinces]);

  useEffect(() => {
    if (!mapFocusRequest) return;
    const originPc = playerCities.find((p) => p.id === mapFocusRequest.originCityId);
    const home = mapCities.find((c) => c.name === originPc?.name);
    const target = mapCities.find((c) => c.name === mapFocusRequest.targetName);
    if (home && target) {
      setFitBounds(L.latLngBounds([[home.lat, home.lng], [target.lat, target.lng]]));
      setFlyTarget(null);
    }
    clearMapFocusRequest();
  }, [mapFocusRequest, playerCities, mapCities, clearMapFocusRequest]);

  const pageClassName = useMemo(
    () => [
      'map-page',
      'map-page--cyber',
      'map-page--tactical',
      'map-page--command-theater',
      mapLocked && isMobile ? 'map-interaction-locked' : 'map-interaction-unlocked',
      mapTargetPickRequest && 'map-page--pick-target',
      isFullscreen && 'map-page--fullscreen',
    ].filter(Boolean).join(' '),
    [mapLocked, isMobile, mapTargetPickRequest, isFullscreen],
  );

  return (
    <div ref={theaterRef} className={pageClassName}>
      {isFullscreen && (
        <button
          type="button"
          className="map-fs-exit-btn"
          onClick={exitFullscreen}
          aria-label="Tam ekrandan çık"
        >
          [ TAM EKRANDAN ÇIK ]
        </button>
      )}

      {isMobile && !isFullscreen && (
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
                if (city) handleConsoleCitySelect(city);
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

      {!isFullscreen && (
        <div className="map-page-toolbar">
          <MapTacticalCommandBar
            ideologyView={ideologyView}
            onToggleIdeology={handleToggleIdeology}
            isFullscreen={isFullscreen}
          />
          <button
            type="button"
            className="map-fs-hero-btn map-fs-hero-btn--compact"
            onClick={toggleFullscreen}
            aria-label="Taktik harekat odası tam ekran modunu aç"
          >
            [ TAM EKRAN ]
          </button>
        </div>
      )}

      <div className="map-container map-container-wrap map-container-wrap--cyber map-container--tactical">
        {(!isMobile || !mapLocked) && (
          <TacticalSearchConsole
            mapCities={mapCities}
            cityPick={cityPick}
            setCityPick={setCityPick}
            onCitySelect={handleConsoleCitySelect}
            search={search}
            setSearch={setSearch}
            searchCoord={searchCoord}
            setSearchCoord={setSearchCoord}
            handleSearch={handleSearch}
            scanPulse={scanPulse}
            onResetFilter={clearMapFilters}
            hasActiveFilter={hasMapFilter}
            liveStats={mapLiveStats}
          />
        )}

        <MapIntelSidebar />

        <div className="map-hex-pulse-layer" aria-hidden="true">
          {hexPulses.map((pulse) => (
            <div
              key={pulse.id}
              className="map-hex-pulse"
              style={{ left: pulse.x, top: pulse.y }}
            >
              <span className="map-hex-pulse__shape" />
            </div>
          ))}
        </div>

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
          <TurkeyLeafletMap
            provinces={provinces}
            botProvinceNames={botProvinceNames}
            botPulsePhaseRef={botPulsePhaseRef}
            onEachProvince={onEachProvince}
            ideologyView={ideologyView}
            filteredCities={filteredCities}
            mapCities={mapCities}
            playerCities={playerCities}
            playerIdeology={playerIdeology}
            activeHighlightCity={activeHighlightCity}
            provinceLayerRef={provinceLayerRef}
            expeditions={expeditions}
            activeCityId={activeCityId}
            underAttack={underAttack}
            incomingAttacks={incomingAttacks}
            onSelectCity={handleSelectCity}
            onCityHover={handleCityHover}
            onCityHoverEnd={handleCityHoverEnd}
            mapZoom={mapZoom}
            activeLat={activeLat}
            activeLng={activeLng}
            fitBounds={fitBounds}
            flyTarget={flyTarget}
            isMobile={isMobile}
            interactionLocked={interactionLocked}
            hudCollapsed={hudCollapsed}
            onViewportChange={setViewportStable}
            onMapClickPulse={handleMapClickPulse}
          />
        )}

        <div className="map-radar-scan-layer" aria-hidden="true">
          <div className="map-radar-scan-layer__glow" />
          <div className="map-radar-scan-layer__beam" />
        </div>

        {isMobile && !isFullscreen && (
          <>
            <button
              type="button"
              className="map-collapse-toggle map-collapse-toggle--hud"
              onClick={() => setHudCollapsed((v) => !v)}
              aria-expanded={!hudCollapsed}
            >
              {hudCollapsed ? 'HUD Aç' : 'HUD Kapat'}
            </button>
            <button
              type="button"
              className="map-collapse-toggle map-collapse-toggle--minimap"
              onClick={() => setMiniMapCollapsed((v) => !v)}
              aria-expanded={!miniMapCollapsed}
            >
              {miniMapCollapsed ? 'Mini Harita' : 'Mini Harita Kapat'}
            </button>
          </>
        )}

        <div className={`map-minimap-wrap${miniMapCollapsed && isMobile ? ' map-minimap-wrap--collapsed' : ''}`}>
          <MapMiniMap viewport={viewport} activeCity={activeMapCity} mapCities={mapCities} />
        </div>

        <MapStatusBand />

        {selectedCity && (
          <CityDetailPanel city={selectedCity} onClose={handleCloseCityPanel} />
        )}
      </div>
    </div>
  );
}
