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
import { safeFilterMapCities, safeMapCities, safeRunMapOp } from '../lib/mapSafeUtils';
import { useMountedRef } from '../hooks/useMountedRef';
import { enrichMapCityWithProvince } from './cityProvinceMatch';
import { buildBotProvinceNameSet, buildOwnProvinceNameSet } from '../lib/botProvincePulse';
import { useMapFullscreen } from '../hooks/useMapFullscreen';
import { useProvinceMapHandlers } from './useProvinceMapHandlers';
import { useGameStore, useUnderAttack } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { releaseMapSessionLocks } from './mapRouteCleanup';
import { buildMapCitySearchList } from '../lib/mapCitySearchList';
import {
  buildLastViewedFromCity,
  buildLastViewedFromProvince,
  resolveMapCityFromLastViewed,
} from '../lib/mapLastViewedLocation';
import MapCoordTooltip from '../components/MapCoordTooltip';
import HudBackButton from '../components/HudBackButton';
import CustomDropdown from '../components/CustomDropdown';

export default function TurkeyMap() {
  const navigate = useNavigate();
  const { theaterRef, isFullscreen, exitFullscreen, toggleFullscreen } = useMapFullscreen();

  const mapCitiesRaw = useGameStore((s) => s.mapCities);
  const mountedRef = useMountedRef();
  const mapCities = useMemo(
    () => safeMapCities(safeRunMapOp(() => normalizeMapCities(mapCitiesRaw), [])),
    [mapCitiesRaw],
  );
  const expeditions = useGameStore((s) => s.expeditions);
  const mapFocusRequest = useGameStore((s) => s.mapFocusRequest);
  const clearMapFocusRequest = useGameStore((s) => s.clearMapFocusRequest);
  const lastViewedLocation = useGameStore((s) => s.lastViewedLocation);
  const setLastViewedLocation = useGameStore((s) => s.setLastViewedLocation);
  const clearLastViewedLocation = useGameStore((s) => s.clearLastViewedLocation);
  const mapExpeditionLaunchRequest = useGameStore((s) => s.mapExpeditionLaunchRequest);
  const clearMapExpeditionLaunchRequest = useGameStore((s) => s.clearMapExpeditionLaunchRequest);
  const mapTargetPickRequest = useGameStore((s) => s.mapTargetPickRequest);
  const fulfillMapTargetPick = useGameStore((s) => s.fulfillMapTargetPick);
  const clearMapTargetPick = useGameStore((s) => s.clearMapTargetPick);
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
  const [restoreViewport, setRestoreViewport] = useState(null);
  const fsViewportSnapshotRef = useRef(null);
  const [hoverCoord, setHoverCoord] = useState(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const [ideologyView, setIdeologyView] = useState(false);
  const [activeHighlightCity, setActiveHighlightCity] = useState(null);
  const [hexPulses, setHexPulses] = useState([]);
  const [expeditionLaunchMode, setExpeditionLaunchMode] = useState(false);
  const [panelInitialActionMode, setPanelInitialActionMode] = useState(null);
  const [consoleForceExpanded, setConsoleForceExpanded] = useState(false);

  const [theaterPortalEl, setTheaterPortalEl] = useState(null);
  const provinceLayerRef = useRef(null);
  const activeProvinceLayerRef = useRef(null);
  const botPulsePhaseRef = useRef(0);
  const hexPulseTimersRef = useRef([]);
  const mapViewRestoredRef = useRef(false);
  const pendingPanelCityRef = useRef(null);

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
  const ownProvinceNamesRef = useRef(new Set());

  /** Ana haritada sürükle-pan her zaman (mobilde sayfa kilidi yalnızca dış kaydırmayı etkiler) */
  const mapPanEnabled = true;

  const ensureMapBotProvinces = useGameStore((s) => s.ensureMapBotProvinces);

  useEffect(() => () => releaseMapSessionLocks(), []);

  const botProvinceNames = useMemo(
    () => buildBotProvinceNameSet(mapCities, playerCities, provinces),
    [mapCities, playerCities, provinces],
  );
  const ownProvinceNames = useMemo(
    () => buildOwnProvinceNameSet(mapCities, playerCities, provinces),
    [mapCities, playerCities, provinces],
  );
  botProvinceNamesRef.current = botProvinceNames;
  ownProvinceNamesRef.current = ownProvinceNames;

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
    return safeFilterMapCities(mapCities, (c) => String(c.name).toLowerCase().includes(q));
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

  const searchCityList = useMemo(
    () => buildMapCitySearchList(mapCities, provinces, playerCities),
    [mapCities, provinces, playerCities],
  );

  const mapLiveStats = useMemo(() => safeRunMapOp(() => ({
    botCities: mapCities.filter((c) => c?.status === 'bot').length,
    playerCities: playerCities?.length ?? 0,
    activeExpeditions: (expeditions ?? []).filter((e) => e?.direction === 'outgoing').length,
  }), { botCities: 0, playerCities: 0, activeExpeditions: 0 }), [mapCities, playerCities, expeditions]);

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

  const persistMapView = useCallback((city) => {
    const snapshot = buildLastViewedFromCity(city, viewport);
    if (snapshot) setLastViewedLocation(snapshot);
  }, [viewport, setLastViewedLocation]);

  const showCityDetailPanel = useCallback((cityOrHighlight, { initialActionMode = null } = {}) => {
    const enriched = enrichMapCityWithProvince(cityOrHighlight, playerCities);
    setActiveHighlightCity(enriched);
    setSelectedCity(enriched);
    setPanelInitialActionMode(initialActionMode);
    persistMapView(enriched);
    return enriched;
  }, [playerCities, persistMapView]);

  const openMapCityPanel = useCallback((cityOrHighlight, { initialActionMode = null, skipFly = false } = {}) => {
    const enriched = showCityDetailPanel(cityOrHighlight, { initialActionMode });
    if (!skipFly && enriched.lat != null && enriched.lng != null) {
      setFitBounds(null);
      setFlyTarget({
        lat: enriched.lat,
        lng: enriched.lng,
        zoom: 8,
        at: Date.now(),
      });
    }
    return enriched;
  }, [playerCities, showCityDetailPanel]);

  const resolveConsoleCity = useCallback((city) => {
    if (!city?.name) return city;
    return searchCityList.find((c) => c.name === city.name)
      ?? mapCities.find((c) => c.name === city.name)
      ?? city;
  }, [searchCityList, mapCities]);

  const focusCityOnMap = useCallback((city, { openPanel = false, initialActionMode = null } = {}) => {
    const enriched = enrichMapCityWithProvince(city, playerCities);
    if (openPanel) {
      pendingPanelCityRef.current = enriched;
      openMapCityPanel(enriched, { initialActionMode });
      return enriched;
    }
    setActiveHighlightCity(enriched);
    setSelectedCity(null);
    if (enriched.lat != null && enriched.lng != null) {
      setFitBounds(null);
      setFlyTarget({
        lat: enriched.lat,
        lng: enriched.lng,
        zoom: 8,
        at: Date.now(),
      });
    }
    persistMapView(enriched);
    return enriched;
  }, [playerCities, persistMapView, openMapCityPanel]);

  const flyToCityAndOpenPanel = useCallback((city, { initialActionMode = null } = {}) => {
    const resolved = resolveConsoleCity(city);
    setCityPick(resolved.name);
    const enriched = enrichMapCityWithProvince(resolved, playerCities);
    pendingPanelCityRef.current = enriched;

    if (expeditionLaunchMode) {
      const own = new Set(playerCities.map((c) => c.name));
      if (!own.has(enriched.name) && enriched.status !== 'empty') {
        setExpeditionLaunchMode(false);
        openMapCityPanel(enriched, { initialActionMode: initialActionMode ?? 'troops' });
        pendingPanelCityRef.current = null;
        return enriched;
      }
    }

    setActiveHighlightCity(enriched);
    setSelectedCity(enriched);
    setPanelInitialActionMode(initialActionMode);

    if (enriched.lat != null && enriched.lng != null) {
      setFitBounds(null);
      setFlyTarget({
        lat: enriched.lat,
        lng: enriched.lng,
        zoom: 8,
        at: Date.now(),
        openPanelAfter: true,
      });
    }
    persistMapView(enriched);
    return enriched;
  }, [
    playerCities,
    persistMapView,
    expeditionLaunchMode,
    openMapCityPanel,
    resolveConsoleCity,
  ]);

  const openCityDetail = useCallback(
    (city) => focusCityOnMap(city, { openPanel: true }),
    [focusCityOnMap],
  );

  const handleSelectCity = useCallback((city, { skipFly = false } = {}) => {
    const enriched = enrichMapCityWithProvince(city, playerCities);
    if (mapTargetPickRequest) {
      const own = new Set(playerCities.map((c) => c.name));
      if (own.has(enriched.name)) return;
      fulfillMapTargetPick(enriched.name);
      navigate(mapTargetPickRequest.returnPath ?? '/istihbarat');
      return;
    }
    if (expeditionLaunchMode) {
      const own = new Set(playerCities.map((c) => c.name));
      if (own.has(enriched.name) || enriched.status === 'empty') return;
      setExpeditionLaunchMode(false);
      openMapCityPanel(enriched, { initialActionMode: 'troops', skipFly });
      return;
    }
    openMapCityPanel(enriched, { skipFly });
  }, [
    mapTargetPickRequest,
    expeditionLaunchMode,
    playerCities,
    fulfillMapTargetPick,
    navigate,
    openMapCityPanel,
  ]);

  const handleFlyCompleteOpenPanel = useCallback(() => {
    const city = pendingPanelCityRef.current;
    if (!city) return;
    pendingPanelCityRef.current = null;
    handleSelectCity(city, { skipFly: true });
  }, [handleSelectCity]);

  const handleProvinceView = useCallback((highlight) => {
    if (mapTargetPickRequest) return;
    const snapshot = buildLastViewedFromProvince({
      provinceName: highlight.provinceName ?? highlight.name,
      provinceCode: highlight.province,
      lat: highlight.lat,
      lng: highlight.lng,
      status: highlight.status ?? 'empty',
    });
    if (snapshot) setLastViewedLocation(snapshot);
    openMapCityPanel(highlight);
  }, [mapTargetPickRequest, openMapCityPanel, setLastViewedLocation]);

  const { onEachProvince } = useProvinceMapHandlers({
    mapCities,
    playerCities,
    mapTargetPickRequest,
    expeditionLaunchMode,
    fulfillMapTargetPick,
    navigate,
    handleSelectCity,
    openMapCityPanel,
    onProvinceView: handleProvinceView,
    setActiveHighlightCity,
    activeProvinceLayerRef,
    botProvinceNamesRef,
    ownProvinceNamesRef,
  });

  const hoverRafRef = useRef(0);
  const pendingHoverRef = useRef(null);

  const handleCityHover = useCallback((payload) => {
    pendingHoverRef.current = payload;
    if (hoverRafRef.current) return;
    hoverRafRef.current = window.requestAnimationFrame(() => {
      hoverRafRef.current = 0;
      setHoverCoord(pendingHoverRef.current);
    });
  }, []);

  const handleCityHoverEnd = useCallback(() => {
    pendingHoverRef.current = null;
    if (hoverRafRef.current) {
      window.cancelAnimationFrame(hoverRafRef.current);
      hoverRafRef.current = 0;
    }
    setHoverCoord(null);
  }, []);

  useEffect(() => () => {
    if (hoverRafRef.current) window.cancelAnimationFrame(hoverRafRef.current);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setScanPulse(true);
    window.setTimeout(() => setScanPulse(false), 480);
    const q = search.trim().toLowerCase();
    const coord = searchCoord.trim();
    if (coord) {
      const [lat, lng] = coord.split(',').map((n) => parseFloat(n.trim()));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const near = mapCities.find(
          (c) => Math.abs(c.lat - lat) < 1 && Math.abs(c.lng - lng) < 1,
        );
        if (near) {
          setCityPick(near.name);
          flyToCityAndOpenPanel(near);
        } else {
          setSelectedCity(null);
          setActiveHighlightCity({ name: 'Koordinat', status: 'empty', lat, lng });
          setFlyTarget({ lat, lng, at: Date.now() });
        }
        return;
      }
    }
    const pool = searchCityList.length ? searchCityList : mapCities;
    const city = pool.find((c) => c.name.toLowerCase().includes(q));
    if (city) {
      setCityPick(city.name);
      flyToCityAndOpenPanel(city);
    }
  }, [search, searchCoord, mapCities, searchCityList, flyToCityAndOpenPanel]);

  const clearMapFilters = useCallback(() => {
    setSearch('');
    setSearchCoord('');
    setCityPick('');
    setSelectedCity(null);
    setActiveHighlightCity(null);
    setFlyTarget(null);
    setFitBounds(TURKEY_MAX_BOUNDS);
    clearLastViewedLocation();
    mapViewRestoredRef.current = false;
    if (activeProvinceLayerRef.current) {
      activeProvinceLayerRef.current.setStyle(getProvinceStyle());
      activeProvinceLayerRef.current = null;
    }
  }, [clearLastViewedLocation]);

  const handleCloseCityPanel = useCallback(() => {
    setSelectedCity(null);
    setActiveHighlightCity(null);
    setPanelInitialActionMode(null);
    if (activeProvinceLayerRef.current) {
      activeProvinceLayerRef.current.setStyle(getProvinceStyle());
      activeProvinceLayerRef.current = null;
    }
  }, []);

  const handleToggleIdeology = useCallback(() => {
    setIdeologyView((v) => !v);
  }, []);

  const handleConsoleCitySelect = useCallback((city) => {
    flyToCityAndOpenPanel(city);
  }, [flyToCityAndOpenPanel]);

  useEffect(() => {
    setMapReady(true);
    return () => setMapReady(false);
  }, []);

  useEffect(() => {
    if (!mapExpeditionLaunchRequest || !mapReady) return undefined;
    clearMapExpeditionLaunchRequest();
    setExpeditionLaunchMode(true);
    setConsoleForceExpanded(true);
    try {
      localStorage.setItem('tactical-console-expanded', '1');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('map-layout-changed'));
    return undefined;
  }, [mapExpeditionLaunchRequest, mapReady, clearMapExpeditionLaunchRequest]);

  /** Mobil harita: kilidi açıkken sayfa kaymasını engelle */
  useEffect(() => {
    if (!isMobile) return undefined;
    if (mapLocked) {
      document.body.classList.add('map-scroll-locked');
    } else {
      document.body.classList.remove('map-scroll-locked');
    }
    return () => document.body.classList.remove('map-scroll-locked');
  }, [isMobile, mapLocked]);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/geo/provinces.json', { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`provinces ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (mountedRef.current) setProvinces(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      });
    return () => ac.abort();
  }, [mountedRef]);

  useEffect(() => {
    if (!provinces) return;
    ensureMapBotProvinces(provinces);
  }, [provinces, ensureMapBotProvinces]);

  useEffect(() => {
    if (!mapFocusRequest) return undefined;
    mapViewRestoredRef.current = true;
    try {
      const originPc = playerCities.find((p) => p.id === mapFocusRequest.originCityId);
      const home = mapCities.find((c) => c.name === originPc?.name);
      const target = mapCities.find((c) => c.name === mapFocusRequest.targetName);
      if (home && target && mountedRef.current) {
        setFitBounds(L.latLngBounds([[home.lat, home.lng], [target.lat, target.lng]]));
        setFlyTarget(null);
        if (target) openCityDetail(target);
      }
    } catch (err) {
      console.warn('[MAP_FOCUS]', err);
    }
    clearMapFocusRequest();
    return undefined;
  }, [mapFocusRequest, playerCities, mapCities, clearMapFocusRequest, mountedRef, openCityDetail]);

  /** Sidebar’dan dönüşte son harita lokasyonu + detay paneli */
  useEffect(() => {
    if (mapViewRestoredRef.current) return undefined;
    if (mapTargetPickRequest || mapFocusRequest || mapExpeditionLaunchRequest) return undefined;
    if (!lastViewedLocation || !mapCities.length || !mapReady) return undefined;

    const restored = resolveMapCityFromLastViewed(lastViewedLocation, mapCities, playerCities);
    if (!restored) return undefined;

    mapViewRestoredRef.current = true;
    setSelectedCity(restored);
    setActiveHighlightCity(restored);

    const lat = lastViewedLocation.centerLat ?? restored.lat;
    const lng = lastViewedLocation.centerLng ?? restored.lng;
    if (lat != null && lng != null) {
      setFlyTarget({ lat, lng, at: Date.now() });
    }

    return undefined;
  }, [
    lastViewedLocation,
    mapCities,
    playerCities,
    mapReady,
    mapTargetPickRequest,
    mapFocusRequest,
    mapExpeditionLaunchRequest,
  ]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const run = () => window.dispatchEvent(new Event('map-layout-changed'));
    run();
    const t = window.setTimeout(run, 120);
    return () => window.clearTimeout(t);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) return undefined;

    const snap = fsViewportSnapshotRef.current;
    if (!snap?.center) return undefined;

    fsViewportSnapshotRef.current = null;
    const timer = window.setTimeout(() => {
      setRestoreViewport({
        center: snap.center,
        zoom: snap.zoom,
        at: Date.now(),
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen && viewport?.center) {
      fsViewportSnapshotRef.current = {
        center: { lat: viewport.center.lat, lng: viewport.center.lng },
        zoom: viewport.zoom,
      };
    }
    toggleFullscreen();
  }, [isFullscreen, viewport, toggleFullscreen]);

  const pageClassName = useMemo(
    () => [
      'map-page',
      'map-page--cyber',
      'map-page--tactical',
      'map-page--command-theater',
      mapLocked && isMobile ? 'map-interaction-locked' : 'map-interaction-unlocked',
      mapTargetPickRequest && 'map-page--pick-target',
      expeditionLaunchMode && 'map-page--expedition-launch',
      isFullscreen && 'map-page--fullscreen',
    ].filter(Boolean).join(' '),
    [mapLocked, isMobile, mapTargetPickRequest, expeditionLaunchMode, isFullscreen],
  );

  const fsPortalRoot = isFullscreen ? theaterPortalEl : null;

  return (
    <div ref={theaterRef} className={pageClassName}>
      <div
        ref={setTheaterPortalEl}
        className="map-theater-portal-anchor"
        aria-hidden={!isFullscreen}
      />

      {isFullscreen && (
        <div className="map-fs-chrome" data-map-no-pan>
          <button
            type="button"
            className={`btn btn-secondary btn-sm map-fs-ideology-btn map-ideology-toggle${ideologyView ? ' active' : ''}`}
            onClick={handleToggleIdeology}
            aria-pressed={ideologyView}
          >
            [ SİYASİ İDEOLOJİ GÖRÜNÜMÜ ]
          </button>
          <button
            type="button"
            className="map-fs-exit-btn"
            onClick={exitFullscreen}
            aria-label="Tam ekrandan çık"
          >
            [ TAM EKRANDAN ÇIK ]
          </button>
        </div>
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
            <CustomDropdown
              className="map-city-select map-city-select--mobile"
              value={cityPick}
              onChange={(name) => {
                setCityPick(name);
                const city = mapCities.find((c) => c.name === name);
                if (city) handleConsoleCitySelect(city);
              }}
              placeholder="Şehir ara..."
              aria-label="Şehir ara"
              options={[
                { value: '', label: 'Şehir ara...', disabled: true },
                ...mapCities.map((c) => ({
                  value: c.name,
                  label: `${c.name} — ${c.status === 'bot' ? 'BOT' : (c.owner || 'Boş')}`,
                })),
              ]}
            />
          )}
          <span className="map-lock-hint">
            {mapLocked
              ? 'İki parmakla yakınlaştırın · haritayı sürükleyin'
              : 'Kilidi açınca yalnızca harita alanı kayar · şehir seçmek için listeden seçin'}
          </span>
        </div>
      )}

      <MapCoordTooltip hover={hoverCoord} portalRoot={fsPortalRoot} />

      {mapTargetPickRequest && (
        <div className="map-pick-target-banner" role="status">
          <span>[ HEDEF SEÇ ] — Haritada bir düşman üssüne tıklayın</span>
          <HudBackButton
            className="btn btn-secondary btn-sm hud-back-btn map-pick-target-banner__back"
            onStepBack={() => {
              const returnPath = mapTargetPickRequest.returnPath ?? '/istihbarat';
              clearMapTargetPick();
              const idx = window.history.state?.idx;
              if (typeof idx === 'number' && idx > 0) navigate(-1);
              else navigate(returnPath);
            }}
            label="Geri"
          />
        </div>
      )}

      {expeditionLaunchMode && !mapTargetPickRequest && (
        <div className="map-pick-target-banner map-pick-target-banner--expedition" role="status">
          <span>[ SEFER BAŞLAT ] — Haritada veya listeden hedef şehir seçin</span>
          <HudBackButton
            className="btn btn-secondary btn-sm hud-back-btn map-pick-target-banner__back"
            onStepBack={() => {
              setExpeditionLaunchMode(false);
              navigate('/seferler');
            }}
            label="İptal"
          />
        </div>
      )}

      {!isFullscreen && (
        <div className="map-page-toolbar">
          <MapTacticalCommandBar
            ideologyView={ideologyView}
            onToggleIdeology={handleToggleIdeology}
          />
          <button
            type="button"
            className="map-fs-hero-btn map-fs-hero-btn--compact"
          onClick={handleToggleFullscreen}
            aria-label="Taktik harekat odası tam ekran modunu aç"
          >
            [ TAM EKRAN ]
          </button>
        </div>
      )}

      <div className="map-container map-container-wrap map-container-wrap--cyber map-container--tactical">
        {!mapReady && (
          <div className="map-loading-placeholder" aria-live="polite">
            Harita yükleniyor…
          </div>
        )}

        {mapReady && (
          <TurkeyLeafletMap
            provinces={provinces}
            botProvinceNames={botProvinceNames}
            ownProvinceNames={ownProvinceNames}
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
            restoreViewport={restoreViewport}
            onFlyComplete={handleFlyCompleteOpenPanel}
            isMobile={isMobile}
            mapPanEnabled={mapPanEnabled}
            hudCollapsed={hudCollapsed}
            onViewportChange={setViewportStable}
            onMapClickPulse={handleMapClickPulse}
            isFullscreen={isFullscreen}
            showLocHud={!hoverCoord}
          />
        )}

        <div className="map-tactical-overlay" aria-hidden="true">
          <div className="map-tactical-grid" />
          <div className="map-tactical-scanlines" />
          <div className="map-tactical-radar-sweep" />
        </div>

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

        <div className="map-radar-scan-layer" aria-hidden="true">
          <div className="map-radar-scan-layer__glow" />
          <div className="map-radar-scan-layer__beam" />
        </div>

        <TacticalSearchConsole
          searchCities={searchCityList}
          mapCities={mapCities}
          cityPick={cityPick}
          setCityPick={setCityPick}
          onCitySelect={handleConsoleCitySelect}
          onFlyToCity={(city) => flyToCityAndOpenPanel(city)}
          search={search}
          setSearch={setSearch}
          searchCoord={searchCoord}
          setSearchCoord={setSearchCoord}
          handleSearch={handleSearch}
          scanPulse={scanPulse}
          onResetFilter={clearMapFilters}
          hasActiveFilter={hasMapFilter}
          liveStats={mapLiveStats}
          forceExpanded={consoleForceExpanded}
        />

        <MapIntelSidebar />

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
      </div>

      {selectedCity && (
        <CityDetailPanel
          city={selectedCity}
          onClose={handleCloseCityPanel}
          initialActionMode={panelInitialActionMode}
          portalRoot={fsPortalRoot}
        />
      )}
    </div>
  );
}
